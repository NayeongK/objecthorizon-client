# Challenge

# 1. 색상의 유사성을 어떻게 알 수 있을까?

## 1-1. 수치를 비교해 색상의 유사성을 파악하기

색상 간의 유사성을 파악하는 다양한 기법이 있습니다 (CIE76 색차 공식, 색상 히스토그램 비교, 구조적 유사성 지수 (SSIM) 등)
<br />
이러한 특수한 방법을 사용하지 않고도 색상을 수치로 표현하고, 그 수치의 차이를 비교하는 방법으로 색상의 유사성을 알 수 있을 것이라고 생각했습니다.

<img width="300" alt="3d 산점도" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/9d23b183-9b50-4c82-9c60-403f87cc16e2">

위 도표는 실제 DB에 저장되어있는 데이터의 R, G, B 값의 분포를 나타낸 3d 산점도 입니다.
<br />
가까운 곳에 있는 점들 간의 색상이 유사한 것을 볼 수 있습니다. R, G, B 수치 간의 차이를 비교하는 방식은 여러 장점이 있었습니다.
<br />
Canvas API를 이용해 R, G, B 값을 쉽게 얻을 수 있으며, 외부 라이브러리를 사용하지 않을 수 있고, 색상의 유사성을 표현하는 정확한 방법이라는 장점이 있어 이 방법을 채택했습니다.

## 1-2 색상의 차이를 비교하는 방법

1.평균 거리 방식
<br /> 2.색상 비율 방식
<br /> 3.유클리드 거리 방식

유클리드 거리는 R, G, B 3차원 공간에서의 두 점 사이의 거리를 구하는 방법 입니다. 두 점의 RGB 수치의 차이를 3차원에서의 직선 거리로 표현하는 기법입니다. 직선 거리가 작으면 두 점 사이의 거리가 가깝기 때문에 색상의 유사성이 높다고 판단할 수 있습니다.

<img width="450" alt="유클리드" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/2890bdbb-9fb4-4d54-9571-0416cf34702f">

### 색상의 유사성을 계산

세가지 방법 중 가장 정확성이 높고, 색상의 왜곡이 적은 유클리드 거리 공식을 사용했습니다.

실제 코드에서는 아래와 같이 구현했습니다.

```jsx
const calculateDistance = (rgb1, rgb2) => {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;

  return Math.sqrt(
    Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2),
  );
};
```

유클리드 거리 공식을 이용해서 RGB 색상 공간에서 두 색상 사이의 거리를 비교해서 가장 유사한 색을 찾을 수 있었습니다.

<br />
<br />

# 2. 효율적으로 DB를 탐색할 수 있을까?

## 2-1. 부분 탐색으로도 정확한 조회가 가능하도록 커스텀 탐색 로직 구현

클라이언트에서 보낸 색상과 가장 가까운 색상을 찾기 위해서 DB 전체를 탐색하는 것은 비효율적일 것입니다.

DB 전체를 탐색하지 않고 부분만 탐색해도 정확한 조회가 가능하도록 커스텀 탐색 로직을 구현했습니다.

R, G, B 값은 0부터 255까지로 표현됩니다. 이 R, G, B 값을 축으로 해서 아래 그림과 같은 3차원 공간으로 표현할 수 있습니다.

<img width="400" alt="rgb" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/935e5e11-ead1-483e-9daa-7c300140117c">

이 색상의 범위를 이용해서 각각의 구역으로 나누어, 클라이언트에서 보낸 색상이 포함된 구역과 같은 구역의 값들과 거리를 측정하는 방법을 사용했습니다.

R, G, B를 각각 몇 개의 구역으로 나눌지 판단하기 위해 RGB 3차원 공간을 총 몇개의 구역으로 나누는지를 계산했습니다. 그리고 사진의 분포가 일정하다는 가정 하에 한 구역당 몇 개의 사진이 들어갈 지 계산했습니다.

|       | 총 구역의 갯수               | 한 구역 당 사진 수   |
| ----- | ---------------------------- | -------------------- |
| 5등분 | $$5 \times 5 \times5 = 125$$ | $678 \div 125 = 5$장 |
| 6등분 | $$6 \times 6 \times6 = 216$$ | $678 \div 216 = 3$장 |
| 7등분 | $$7 \times 7 \times7 = 343$$ | $678 \div 343 = 2$장 |

5등분씩 나누게 되면, 인접 구역 내에 사진이 많아져서, 거리 연산 횟수가 많아집니다.

7등분씩 나누게 되면, 한 구역에 사진이 없을 확률도 높아지고, 인접하는 구역 내에 사진이 없을 확률도 존재합니다. 즉, 가장 유사한 사진을 검색할 수 없을 확률이 존재합니다.

따라서 전체 R, G, B를 각각 6개의 구역으로 나누었습니다. 밀도의 불균일성을 고려 하더라도 한 구역에 1개 이상 있을 확률이 높다고 판단했습니다. 실제로도 아래의 분포에서 대부분의 구역에 사진이 존재하는 것을 볼 수 있습니다.

<img width="300" alt="3d 산점도" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/9d23b183-9b50-4c82-9c60-403f87cc16e2">

## 2-3. 정확성을 위한 탐색 : 인접한 구역을 포함하기

### 탐색 속도 감소 vs 탐색 결과의 정확성

클라이언트에서 보낸 색상의 구역과 동일한 구역만 탐색하면 속도가 매우 빨라진다는 장점이 있습니다.

하지만 동일한 구역에 있는 사진들만 탐색한다면 탐색 결과의 정확성이 줄어듭니다.
같은 구역인 사진들 보다, 인접한 구역에 있는 사진들이 색상이 더 가까울 수 있기 때문입니다.

<img width="250" alt="인접" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/7ada337f-d509-4011-9ff9-12513450c4a6">

위 그림은 2차원으로 표현한 구역입니다. 클라이언트에서 보낸 색상을 분홍색 점으로 표시해두었습니다. 이 점과 같은 구역에 속해 있는 녹색점 보다, 인접한 구역에 있는 보라색 지점과의 거리가 더 가까운 것을 볼 수 있습니다. DB에 저장된 사진의 양이 678개로 많지 않아 정교한 색상을 표현하기 어렵고, 유사한 색상을 탐색하는 프로젝트의 특성을 고려했을 때 탐색의 속도보다는 정확성이 더 중요하다고 판단했습니다. 따라서 같은 구역 뿐만 아니라 인접한 구역까지도 함께 탐색해서 가장 유사한 색상을 탐색할 수 있도록 구현했습니다.

### 인접한 구역의 갯수

아래의 그림과 같이, 한 구역을 포함한 인접 구역의 갯수는 총 27개입니다.

<img width="250" alt="인접구역 갯수" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/5b205ee0-bfa7-47b8-b713-fb2dec3c820a">

꼭지점이나 모서리에 해당하는 구역의 경우 각각 8개, 12개 이므로 27개 보다 더 적은 구역을 탐색하게 됩니다.

DB 전체(216개의 구역)을 모두 탐색하지 않고 최대 27개의 구역만 탐색할 수 있도록 구현해, 탐색 범위가 87.5% 감소하게 되었습니다.

- 인접한 구역을 계산하고 구역 내의 색상 값을 찾는 로직
  <br />
  <img width="429" alt="인접 구역 로직" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/fc4a7db7-dd88-4259-9cd3-6cc9dde856ad">
  <br />
  <img width="429" alt="타겟 그룹 로직" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/c054161e-04d7-4574-b66a-9e7cf4dc6af4">

<br />
<br />

# 3. 탐색 로직 최적화하기

## 3-1. 기존 탐색 로직의 문제점

앞서 구현했던 커스텀 탐색 로직 방식에는 두가지 문제점이 있었습니다.

<br />

**1. 사진을 더 많이 추가하게 되면, 구역을 세분화해야합니다.**

6개의 구역으로 나누었을 경우에는 27개의 구역 내에 있는 사진이 많지 않습니다. 따라서 사진을 추가해도 탐색 시간에 큰 차이는 없습니다.

하지만 지금보다 훨씬 많은 사진을 추가하게 되는 상황이 발생한다면, 6개의 구역으로 나누는 방식으로도 많은 사진이 존재하게 됩니다.

이렇게 많은 사진이 추가되는 경우 그때 마다 구역의 갯수를 알맞게 나누고, 다시 구역에 따라 사진을 분류해야합니다. 연산 횟수 최적화를 하기 위한 비용이 많이 들게 됩니다.

<br />

**2. 색상에 따라 사진 탐색 시간의 차이가 존재합니다.**

아래 3d 산점도에 표시한 영역들을 보면 분포가 일정하지 않아 상대적으로 밀도가 높은 구역과 낮은 구역이 존재하게 됩니다.

<img width="400" alt="산점도 분포" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/71e0da5b-9900-4e00-ad5d-f03a4c7a9f96">

이와 같이 상대적으로 밀도가 높은 구역에는 탐색 시간이 많이 소요되게 되고, 밀도가 낮은 구역의 경우에는 탐색 시간이 적게 소요됩니다 .

<img width="800" alt="탐색 시간 (커스텀)" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/aeb1b5c9-7b9b-44c0-ac42-f9e20c7a6efc">

위 사진은 실제로 탐색 시간을 측정한 결과입니다. 적게는 258에서부터 많게는 516까지 탐색 시간의 분포가 일관되지 않은 것을 볼 수 있습니다.
<br />
이 예시에서는 표준편차가 78.84로 계산 되었습니다. 이 처럼 탐색 시간이 일관되지 않다면, 탐색 결과의 신뢰성이 보장되지 않습니다.

## 3-2. 자료구조를 적용해서 탐색의 일관성을 높인다.

처음 고안했던 방법을 사용하지 않고도, MongoDB 전체를 다 탐색하지 않으면서 일관되고 정확하게 탐색할 수 있는 방법을 찾아보았습니다.
<br/>
k-d tree 자료구조는 고차원 공간에서 가까운 이웃을 빠르게 검색하는 데 사용되는 자료구조 입니다.

여기서 '가까운 이웃'이란 유클리드 거리와 같은 거리 측정에 따라 결정됩니다.

k-d tree는 각 노드가 k차원의 한 점을 나타내며, 트리의 각 단계에서 한 차원에 대해 노드를 분할하여 구축됩니다.
<br />
k-d tree는 효율적인 탐색을 위해 공간을 이진 탐색 트리와 유사한 방법으로 분할합니다.

<img width="234" alt="kdtree" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/01a3b424-36da-4e2d-b3ee-177ce1e3871d">

k-d tree 자료구조를 만들 때, RGB 각각을 축으로 사용하여 3차원 k-d tree를 만듭니다.
<br />
이렇게 만들어진 k-d tree를 탐색할 때는 트리를 재귀적으로 내려가면서 현재 노드와 목표 점 사이의 거리를 계산하고, 그 거리를 기반으로 가장 가까운 이웃을 찾습니다.

k-d tree의 시간 복잡도는 데이터 구조를 구축하는 데 O(nlogn) 이며, 이는 모든 데이터 점을 트리에 삽입하는 데 필요한 시간입니다.
<br />
탐색은 평균적으로 O(logn) 시간 복잡도를 가집니다.

k-d tree 자료구조를 이용한 방법으로 로직을 변경한 결과 다음과 같은 결과값을 얻을 수 있었습니다.

<img width="965" alt="탐색 소요 시간 (kdtree)" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/adecb310-49b4-4bcc-9ba6-45425ee6f73d">

소요시간의 표준편차는 26.46으로, 기존 방법의 표준편차 78.84에 비해 표준 편차가 감소했습니다.
<br />
적절한 자료구조로 변경하여 결과값의 일관성이 높아지면서 결과의 신뢰성도 높일 수 있게 되었습니다.

<br />
<br />

# 4. 부드러운 이미지 확대 효과

## 4-1. 어떻게 사진을 자연스럽게 확대할까?

throttle vs requestAnimationFrame 비교
<br />
![throttle](https://github.com/NayeongK/objecthorizon-client/assets/80331804/f78ca1c7-dac4-4ee3-b1b8-84c82038e3fa)
<br />
throttle로 구현된 줌 렌더링의 경우, 화면 렌더링이 부자연스럽거나 끊기는 현상이 발생합니다.
<br />
<br />
![rAF](https://github.com/NayeongK/objecthorizon-client/assets/80331804/a89d17da-d273-478d-974e-f57546ba180d)
<br />
requestAnimationFrame으로 구현된 줌 렌더링의 경우, 줌에 따른 이미지 확대가 자연스럽게 렌더링 됩니다.

## 4-2. 확대 시점을 어떻게 계산할까?

마우스가 위치한 사진의 지점이 확대되도록 하는 방법

## 4-3. 확대와 축소에서의 사용자 경험 증대

<br />
<br />

# 5. 자동화 스크립트로 사진 색상을 추출하고 저장

## 5-1. 사진의 색상을 어떻게 추출할까?

줌 이후에 나오는 사진을 자연스럽게 느끼기 위해서는 색상의 유사성이 중요하다는 생각이 들었습니다.
<br />
하지만 이미지에는 많은 픽셀과 색상들이 존재하고, 그 중에서 어떤 색상을 기준으로 해야 유사하다고 느낄지 고민했습니다.

1. 사진 전체의 픽셀 중 가장 빈도가 높은 색상을 대표 색상으로 선택하기

2. 사진의 배경 픽셀 중 가장 빈도가 높은 색상을 대표 색상으로 선택하기

<img width="510" alt="유사한 색상" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/4ac6b082-83ae-4416-a24a-2f14d2d9ff47">

배경색이 같은 경우의 색상 변화가 더 자연스럽기 때문에 배경의 색상을 유사하게 하는 방법을 선택했습니다.

가장자리의 픽셀값을 사용해서 가장 빈도가 높은 색상을 대표 색상으로 추출하는 로직을 구현했습니다.

<details>
<summary>가장자리 픽셀 추출 로직</summary>

```jsx
const getDominantBackgroundColor = function (canvas) {
  const ctx = canvas.getContext("2d");
  const edgePixels = [];
  const width = canvas.width;
  const height = canvas.height;

  for (let x = 0; x < width; x++) {
    edgePixels.push(ctx.getImageData(x, 0, 1, 1).data);
    edgePixels.push(ctx.getImageData(x, height - 1, 1, 1).data);
  }

  for (let y = 0; y < height; y++) {
    edgePixels.push(ctx.getImageData(0, y, 1, 1).data);
    edgePixels.push(ctx.getImageData(width - 1, y, 1, 1).data);
  }

  const colorCounts = {};

  edgePixels.forEach((pixel) => {
    const key = `${pixel[0]}-${pixel[1]}-${pixel[2]}`;
    if (!colorCounts[key]) {
      colorCounts[key] = 0;
    }
    colorCounts[key]++;
  });

  let dominantColor = null;
  let maxCount = 0;

  Object.keys(colorCounts).forEach((key) => {
    if (colorCounts[key] > maxCount) {
      dominantColor = key;
      maxCount = colorCounts[key];
    }
  });

  return dominantColor ? dominantColor.split("-").map(Number) : null;
};
```

</details>

## 6-1. Safari에서 Wheel 이벤트가 인식되지 않는 문제

### **이벤트 위임과 버블링의 활용**

> 이벤트 위임: `document`에 이벤트 리스너를 설정하여, 더 높은 차원에서 이벤트를 관리했습니다. document에 이벤트 리스너를 설정하는 방법은 개별 요소에 대해 이벤트 리스너를 설정하는 것보다 메모리 효율성을 높일 수 있고, 동적으로 변경되는 DOM 요소들에 대해서도 유연한 이벤트를 처리가 가능합니다.

> 이벤트 버블링: 휠 이벤트는 발생한 요소에서 시작하여 상위 요소로 전파됩니다. 따라서 `document` 수준에서 이벤트를 캐치할 수 있으며, 이를 통해 캔버스 내부에서 발생한 이벤트를 선택적으로 처리할 수 있었습니다.

### 해결 과정

```jsx
useEffect(() => {
  function handleDocumentWheel(e) {
    if (canvasRef.current && canvasRef.current.contains(e.target)) {
      handleWheelEvent(e);
    }
  }

  document.addEventListener("wheel", handleDocumentWheel, { passive: false });

  return () => {
    document.removeEventListener("wheel", handleDocumentWheel);
  };
}, [viewState, images, setImages, sentColor]);
```

- `document.addEventListener("wheel", handleDocumentWheel, { passive: false })`로 문서 전체에 휠 이벤트 리스너를 설정했습니다
- 휠 이벤트가 발생하면 전체 document에서 휠 이벤트를 감지하고 handleDocumentWheel 함수를 호출합니다
- handleDocumentWheel 함수가 호출 되면, `canvasRef.current.contains(e.target)`로 캔버스 내부에서 이벤트가 발생했는지 확인합니다
- 캔버스 내부에서 발생한 휠 이벤트인 경우에만 handleWheelEvent 함수를 호출해 실제 확대/축소 로직을 처리합니다

이벤트 위임과 이벤트 버블링을 사용해서, 문서 전체에서 발생하는 휠 이벤트를 관리하는 방식으로 Safari에서의 이벤트 처리 이슈를 해결했습니다.

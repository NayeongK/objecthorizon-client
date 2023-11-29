# Challenge

# 1. 색상의 유사성을 어떻게 알 수 있을까?

## 1-1. 색상의 유사성을 어떻게 알 수 있을까?

### 색상의 유사성 파악하기 : 색상 수치 비교 방식

색상 간의 유사성을 파악하는 다양한 기법이 있습니다 (CIE76 색차 공식, 색상 히스토그램 비교, 구조적 유사성 지수 (SSIM) 등)

이러한 특수한 방법을 사용하지 않고도 색상을 수치로 표현하고, 그 수치의 차이를 비교하는 방법으로 색상의 유사성을 알 수 있을 것이라고 생각했습니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/a3cf9df9-7375-4c91-93bd-078d68f9e8e3/Untitled.png?id=19ad5749-dc5f-421e-a1d2-d6fcf0f1aaa2&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=YP60Lm2w-XUDiSvek4IVIvsjoScnq9LfMJeihuiX87o&downloadName=Untitled.png" width="300" />

위 도표는 실제 DB에 저장되어있는 데이터의 R, G, B 값의 분포를 나타낸 3d 산점도 입니다. 가까운 곳에 있는 점들 간의 색상이 유사한 것을 볼 수 있습니다. R, G, B 수치 간의 차이를 비교하는 방식은 여러 장점이 있었습니다. Canvas API를 이용해 R, G, B 값을 쉽게 얻을 수 있으며, 외부 라이브러리를 사용하지 않을 수 있고, 색상의 유사성을 표현하는 정확한 방법이라는 장점이 있어 이 방법을 채택했습니다.

## 1-2 색상의 차이를 비교하는 방법

1. 평균 거리 방식
2. 색상 비율 방식
3. 유클리드 거리 방식

   유클리드 거리는 R, G, B 3차원 공간에서의 두 점 사이의 거리를 구하는 방법 입니다. 두 점의 RGB 수치의 차이를 3차원에서의 직선 거리로 표현하는 기법입니다. 직선 거리가 작으면 두 점 사이의 거리가 가깝기 때문에 색상의 유사성이 높다고 판단할 수 있습니다.

    <img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/5625bbfd-4825-4e83-a6c7-0bc6ded230a1/Untitled.png?id=94eaf483-05f6-49f9-b05e-443bce6dc94f&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=sQ44R0ReUPvqSM_49I7aUAWUzrXlab1i9JyZIn8Jml4&downloadName=Untitled.png" width="400" />

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

# 2. 효율적으로 DB를 탐색할 수 있을까?

## 2-1. 부분 탐색으로도 정확한 조회가 가능하도록 커스텀 탐색 로직 구현

클라이언트에서 보낸 색상과 가장 가까운 색상을 찾기 위해서 DB 전체를 탐색하는 것은 비효율적일 것입니다.

DB 전체를 탐색하지 않고 부분만 탐색해도 정확한 조회가 가능하도록 커스텀 탐색 로직을 구현했습니다.

R, G, B 값은 0부터 255까지로 표현됩니다. 이 R, G, B 값을 축으로 해서 아래 그림과 같은 3차원 공간으로 표현할 수 있습니다.

이 색상의 범위를 이용해서 각각의 구역으로 나누어, 클라이언트에서 보낸 색상이 포함된 구역과 같은 구역의 값들과 거리를 측정하는 방법을 사용했습니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/8a1a73de-1c89-41f1-a31c-81f2196d90ec/Untitled.png?id=4007d6cf-3e5c-43d8-8591-329bf629f98b&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=7qnfu2w3gkruw83r3RfgsJNaxeKvcOzzLHxDkWxZ5Is&downloadName=Untitled.png" width="300" />

## 2-2. 구역을 나누는 방법?

R, G, B를 각각 몇 개의 구역으로 나눌지 판단하기 위해 RGB 3차원 공간을 총 몇개의 구역으로 나누는지를 계산했습니다. 그리고 사진의 분포가 일정하다는 가정 하에 한 구역당 몇 개의 사진이 들어갈 지 계산했습니다.

|       | 총 구역의 갯수 | 한 구역 당 사진 수 |
| ----- | -------------- | ------------------ |
| 5등분 | 5*5*5 = 125    | 678/125 = 5장      |
| 6등분 | 6*6*6 = 216    | 678/216 = 3장      |
| 7등분 | 7*7*7 = 343    | 678/343 = 2장      |

5등분씩 나누게 되면, 인접 구역 내에 사진이 많아져서, 거리 연산 횟수가 많아집니다.

7등분씩 나누게 되면, 한 구역에 사진이 없을 확률도 높아지고, 인접하는 구역 내에 사진이 없을 확률도 존재합니다. 즉, 가장 유사한 사진을 검색할 수 없을 확률이 존재합니다.

따라서 전체 R, G, B를 각각 6개의 구역으로 나누었습니다. 밀도의 불균일성을 고려 하더라도 한 구역에 1개 이상 있을 확률이 높다고 판단했습니다. 실제로도 아래의 분포에서 대부분의 구역에 사진이 존재하는 것을 볼 수 있습니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/a3cf9df9-7375-4c91-93bd-078d68f9e8e3/Untitled.png?id=6a60f749-3935-4b99-9553-bcb560b3dca7&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=os3DlTXsy93zO20TCNuX4nzM3lJK15-5nKChSoI-kYE&downloadName=Untitled.png" width="300" />

## 2-3. 정확성을 위한 탐색 : 인접한 구역을 포함하기

### 탐색 속도 감소 vs 탐색 결과의 정확성

클라이언트에서 보낸 색상의 구역과 동일한 구역만 탐색하면 속도가 매우 빨라진다는 장점이 있습니다.

하지만 동일한 구역에 있는 사진들만 탐색한다면 탐색 결과의 정확성이 줄어듭니다.
같은 구역인 사진들 보다, 인접한 구역에 있는 사진들이 색상이 더 가까울 수 있기 때문입니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/880e9f58-b404-48ad-8e52-7ffa2b903fcb/Untitled.png?id=15f80d42-bf50-4bea-b4b1-2fbca9718d46&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=s5iGP49sz4A2bK36LFzZTqlYcynDbmcCWrM2PhEH8RE&downloadName=Untitled.png" width="300" />

위 그림은 2차원으로 표현한 구역입니다. 클라이언트에서 보낸 색상을 분홍색 점으로 표시해두었습니다. 이 점과 같은 구역에 속해 있는 녹색점 보다, 인접한 구역에 있는 보라색 지점과의 거리가 더 가까운 것을 볼 수 있습니다. DB에 저장된 사진의 양이 678개로 많지 않아 정교한 색상을 표현하기 어렵고, 유사한 색상을 탐색하는 프로젝트의 특성을 고려했을 때 탐색의 속도보다는 정확성이 더 중요하다고 판단했습니다. 따라서 같은 구역 뿐만 아니라 인접한 구역까지도 함께 탐색해서 가장 유사한 색상을 탐색할 수 있도록 구현했습니다.

### 인접한 구역의 갯수

아래의 그림과 같이, 한 구역을 포함한 인접 구역의 갯수는 총 27개입니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/42c8b137-ac4a-4dc3-b2a5-bd78195be4d0/Untitled.png?id=1da5e472-6e7e-4b52-a8fa-612d75440b72&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=dd8cPKmtumhPJHlMpWr3j_pXbZvVVejceZ7NCTxF-Yc&downloadName=Untitled.png" width="300" />

꼭지점이나 모서리에 해당하는 구역의 경우 각각 8개, 12개 이므로 27개 보다 더 적은 구역을 탐색하게 됩니다.

DB 전체(216개의 구역)을 모두 탐색하지 않고 최대 27개의 구역만 탐색할 수 있도록 구현해, 탐색 범위가 87.5% 감소하게 되었습니다.

- 인접한 구역을 계산하고 구역 내의 색상 값을 찾는 로직

  <img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/934e8c21-c705-4842-9adf-2d0f0088a1d5/Untitled.png?id=36cc8416-b616-4c98-846d-4e1645a52bbe&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=8r4evFxppMQXUdpoX1yOkYEifQlDvNU3Tpck5C-vsAA&downloadName=Untitled.png" width="300" />
  <img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/b9b96be5-1bee-481f-a57e-66663561c46b/Untitled.png?id=1aadd70c-a1ea-4f64-b746-883565d895b0&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=-_NGZ-iQ9GC9nnFueZi6F4osuxq_bZhWpV5fdcSPtZM&downloadName=Untitled.png" width="300" />

# 3. 탐색 로직 최적화하기

## 3-1. 기존 탐색 로직의 문제점

앞서 구현했던 커스텀 탐색 로직 방식에는 두가지 문제점이 있었습니다.

1. **사진을 더 많이 추가하게 되면, 구역을 세분화해야합니다.**

6개의 구역으로 나누었을 경우에는 27개의 구역 내에 있는 사진이 많지 않습니다. 따라서 사진을 추가해도 탐색 시간에 큰 차이는 없습니다.

하지만 지금보다 훨씬 많은 사진을 추가하게 되는 상황이 발생한다면, 6개의 구역으로 나누는 방식으로도 많은 사진이 존재하게 됩니다.

이렇게 많은 사진이 추가되는 경우 그때 마다 구역의 갯수를 알맞게 나누고, 다시 구역에 따라 사진을 분류해야합니다. 연산 횟수 최적화를 하기 위한 비용이 많이 들게 됩니다.

1. **색상에 따라 사진 탐색 시간의 차이가 존재합니다.**

아래 3d 산점도에 표시한 영역들을 보면 분포가 일정하지 않아 상대적으로 밀도가 높은 구역과 낮은 구역이 존재하게 됩니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/a383bdac-43dc-4876-b44b-02b4d2c3cbcc/Untitled.png?id=13a93ecd-d6ee-4277-a424-c0e837685894&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=GDdzXxBaM4xzUD70L8Q2wVWSEemLwL_ONEAVXtStwOc&downloadName=Untitled.png" width="300" />

이와 같이 상대적으로 밀도가 높은 구역에는 탐색 시간이 많이 소요되게 되고, 밀도가 낮은 구역의 경우에는 탐색 시간이 적게 소요됩니다 .

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/fed62fa1-cd51-4ef7-b4d8-ee3012261b5e/Untitled.png?id=e0bac806-5ceb-4587-bf6c-ae112f0cd377&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=RvIdhy0DF_1Bmn5OV8Ft-Im7xCnbeNze8g9z5on190c&downloadName=Untitled.png" width="300" />
위 사진은 실제로 탐색 시간을 측정한 결과입니다. 적게는 258에서부터 많게는 516까지 탐색 시간의 분포가 일관되지 않은 것을 볼 수 있습니다. 이 예시에서는 표준편차가 78.84로 계산 되었습니다. 이 처럼 탐색 시간이 일관되지 않다면, 탐색 결과의 신뢰성이 보장되지 않습니다.

## 3-2. 자료구조를 적용해서 탐색의 일관성을 높인다.

처음 고안했던 방법을 사용하지 않고도, MongoDB 전체를 다 탐색하지 않으면서 일관되고 정확하게 탐색할 수 있는 방법을 찾아보았습니다. k-d tree 자료구조는 고차원 공간에서 가까운 이웃을 빠르게 검색하는 데 사용되는 자료구조 입니다.

여기서 '가까운 이웃'이란 유클리드 거리와 같은 거리 측정에 따라 결정됩니다.

k-d tree는 각 노드가 k차원의 한 점을 나타내며, 트리의 각 단계에서 한 차원에 대해 노드를 분할하여 구축됩니다. k-d tree는 효율적인 탐색을 위해 공간을 이진 탐색 트리와 유사한 방법으로 분할합니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/0757abab-c9cd-4287-86b4-9625412e2e91/Untitled.png?id=29da6cf3-87fa-464c-822b-c3f57008a521&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=qJJc72P4xAf9zVvB0ig7rLW5VwHaYjgBvCte1o10itA&downloadName=Untitled.png" width="300" />

k-d tree 자료구조를 만들 때, RGB 각각을 축으로 사용하여 3차원 k-d tree를 만듭니다. 이렇게 만들어진 k-d tree를 탐색할 때는 트리를 재귀적으로 내려가면서 현재 노드와 목표 점 사이의 거리를 계산하고, 그 거리를 기반으로 가장 가까운 이웃을 찾습니다.

k-d tree의 시간 복잡도는 데이터 구조를 구축하는 데 O(nlogn) 이며, 이는 모든 데이터 점을 트리에 삽입하는 데 필요한 시간입니다. 탐색은 평균적으로 O(logn) 시간 복잡도를 가집니다.

k-d tree 자료구조를 이용한 방법으로 로직을 변경한 결과 다음과 같은 결과값을 얻을 수 있었습니다.

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/c6cd2734-6759-40ac-911b-96ab8e286443/Untitled.png?id=6e382991-7b2b-4607-af3e-3a9353a9dfa5&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=GpcLPSU2Y0rJbwJMF3TrEQOhKPAft4lUQBT_3gxhYUE&downloadName=Untitled.png" width="300" />

소요시간의 표준편차는 26.46으로, 기존 방법의 표준편차 78.84에 비해 표준 편차가 감소했습니다. 적절한 자료구조로 변경하여 결과값의 일관성이 높아지면서 결과의 신뢰성도 높일 수 있게 되었습니다.

# 4. 부드러운 이미지 확대 효과

## 4-1. 어떻게 사진을 자연스럽게 확대할까?

throttle vs requestAnimationFrame 비교

## 4-2. 확대 시점을 어떻게 계산할까?

마우스가 위치한 사진의 지점이 확대되도록 하는 방법

## 4-3. 확대와 축소에서의 사용자 경험 증대

# 5. 자동화 스크립트로 사진 색상을 추출하고 저장

## 5-1. 사진의 색상을 어떻게 추출할까?

줌 이후에 나오는 사진을 자연스럽게 느끼기 위해서는 색상의 유사성이 중요하다는 생각이 들었습니다. 하지만 이미지에는 많은 픽셀과 색상들이 존재하고, 그 중에서 어떤 색상을 기준으로 해야 유사하다고 느낄지 고민했습니다.

1. 사진 전체의 픽셀 중 가장 빈도가 높은 색상을 대표 색상으로 선택하기

2. 사진의 배경 픽셀 중 가장 빈도가 높은 색상을 대표 색상으로 선택하기

<img src="https://file.notion.so/f/f/a499d1d5-780e-48e4-b285-a43f40cdb1e5/39d221b8-d249-4acf-bc5f-1faf8c45a135/Untitled.png?id=bd979c22-fb3f-409b-a252-156ee0351e8a&table=block&spaceId=a499d1d5-780e-48e4-b285-a43f40cdb1e5&expirationTimestamp=1701331200000&signature=SoE4g0abfSrvkg0HBSfFjlqkNA2i8cNKepW0BDK7EIo&downloadName=Untitled.png" width="300" />

이 중에서도 저는 2번째 방법으로 배경의 색상을 유사하게 하는 방법을 선택했습니다.

가장자리의 픽셀값을 사용해서 가장 빈도가 높은 색상을 대표 색상으로 추출하는 로직을 구현했습니다.

- 가장자리 픽셀 추출 로직

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

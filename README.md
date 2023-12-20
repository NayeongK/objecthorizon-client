# 🌎 Object Horizon

사물의 지평선은 줌으로 확대한 지점과 유사한 색을 가진 사진을 무한히 렌더링하는 웹 앱입니다

[배포사이트](http://app.object-horizon.com)

**preview**
<br/>
![preview2](https://github.com/NayeongK/objecthorizon-client/assets/80331804/d33de3d8-3c73-46bb-b3a5-c41bcd491752)
<br />
<br />

# ✅ Feature

<img width="300" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/23c30fec-162b-4d3a-af2b-86cbe20c48aa">

<br/>

1.터치패드를 이용한 줌 인 모션으로 사진을 확대할 수 있습니다
<br/> 2.일정 비율 이상 확대 되면, 현재 색상과 유사한 다른 사진이 렌더링 됩니다
<br/> 3.마우스의 위치를 향해 확대되므로, 마우스를 이용해 확대 지점을 변경할 수 있습니다
<br/> 4.줌 아웃 모션을 하면 사진이 축소됩니다
<br /> 5.일정 비율 이상 축소 되면, 이전 사진이 역순으로 보여집니다

<br />

# 📋 Table of Contents

[🌎 ObjectHorizon](#object-horizon)

[✅ Feature](#feature)

[💡 Challenges](#💡-challenges)

- [1. DB 탐색 로직의 구현과 최적화 과정](#1-db-탐색-로직의-구현과-최적화-과정)

  - [1-1. 색상의 유사성을 판단하기](#1-1-색상의-유사성을-판단하기)
  - [1-2. 부분 탐색만으로 조회하는 커스텀 로직 구현](#1-2-부분-탐색만으로-조회하는-커스텀-로직-구현)
  - [1-3. K-D Tree 자료구조를 적용해 탐색 로직의 일관성을 향상시키기](#1-3-k-d-tree-자료구조를-적용해서-탐색-로직의-일관성을-향상시키기)

- [2. 이미지를 효율적으로 저장하고 요청하기](#2-이미지를-효율적으로-저장하고-요청하기)

  - [2-1. 자동화 스크립트를 이용해 저장하기](#2-1-자동화-스크립트를-이용해-저장하기)
  - [2-2. 중복 요청을 방지하기](#2-2-중복-요청을-방지하기)

- [3. 이미지 렌더링 최적화하기](#3-이미지-렌더링-최적화하기)
  - [3-1. 부드러운 이미지 확대 효과 구현하기](#3-2-부드러운-이미지-확대-효과-구현하기)
  - [3-2. 마우스의 위치를 향해 확대하는 방법](#3-3-마우스-위치를-기준으로-확대하기)
  - [3-3. 크로스 브라우징 이슈 해결](#3-4-크로스-브라우징-이슈-해결)

[⏰ TimeLine](#timeline)

[⚙️ TechStack](#tech-stack)

<br />

# 💡 Challenges

# 1. DB 탐색 로직의 구현과 최적화 과정

## 1-1. 색상의 유사성을 판단하기

색상 간의 유사성을 파악하는 다양한 기법이 있습니다 (CIE76 색차 공식, 색상 히스토그램 비교, 구조적 유사성 지수 (SSIM) 등)
<br />
이러한 특수한 방법을 사용하지 않고도 색상을 수치로 표현하고, 그 수치의 차이를 비교하는 방법으로 색상의 유사성을 알 수 있을 것이라고 생각했습니다.

그 중에서도 R, G, B 값을 사용 해서 색상을 수치로 표현하기로 했습니다.

<img width="300" alt="3d 산점도" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/9d23b183-9b50-4c82-9c60-403f87cc16e2">

위 도표는 실제 DB에 저장되어있는 데이터의 R, G, B 값의 분포를 나타낸 3d 산점도 입니다.
<br />
가까운 곳에 있는 점들 간의 색상이 유사한 것을 볼 수 있습니다.

R, G, B를 사용해서 색상을 표현하고, 비교하는 방식은 여러 장점이 있었습니다.
<br />
Canvas API를 이용해 R, G, B 값을 쉽게 얻을 수 있으며, 외부 라이브러리를 사용하지 않을 수 있고, 색상을 표현하는 정확한 방법이라는 장점이 있어 이 방법을 채택했습니다.

### 1. 색상의 차이를 비교하는 방법

이 R, G, B 값 간의 차이를 비교하는 방법은 다양했습니다.

1.평균 색상 거리 방식
<br /> 2.색상 비율 방식
<br /> 3.유클리드 거리 방식

<img width="400" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/b4c5a241-73d5-480a-829e-e80cf917a1d2">
<br />

`평균 색상 거리 방식`은 R, G, B의 차이를 단순히 평균냅니다. 색상 공간에서 색상 간의 관계는 단순한 차이의 합보다 훨씬 복잡합니다. 같은 수준의 RGB 차이라도, 색상 공간에서의 실제 거리는 크게 다를 수 있습니다.
<br />
`색상 비율 방식` 은 색상의 절대적인 차이를 고려하지 않기 때문에 색상 왜곡이 크게 발생할 수 있습니다
<br />

#### 유클리드 거리

<img width="400" alt="유클리드" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/2890bdbb-9fb4-4d54-9571-0416cf34702f">

### 2. 색상의 유사성을 계산

세가지 방법 중 가장 정확성이 높고, 색상의 왜곡이 적은 유클리드 거리 공식을 사용했습니다.

<details>
<summary>
참고 : 평균 색상 거리, 색상 비율 방식, 유클리드 거리 방식의 비교
</summary>

(1) 평균 거리 방식

평균 거리 방식은 각 R, G, B의 단순한 평균을 계산하는 방식입니다. <br /> **유사한 색상**: 색상 A: RGB(100, 150, 200), 색상 B: RGB(110, 140, 190)
<br />
**다른 색상**: 색상 C: RGB(100, 150, 200), 색상 D: RGB(200, 50, 100)
<br />

이 각각의 경우를 계산해 보았을 때, 유사한 색상 쌍에서는 평균 색상 거리 결과는 10, 유클리드 거리는 17입니다. 유클리드 거리가 색상 차이를 좀 더 크게 감지 함을 알 수 있습니다.

다른 색상 쌍(C와 D)의 경우, 평균 색상 거리는 100.0, 유클리드 거리는 173.21로 나타났습니다. 이는 더 큰 색상 차이에서도 유클리드 거리가 더 큰 값을 보이며 정밀한 경과를 보임을 알 수 있습니다.

유클리드 거리는 R, G, B 3차원 공간에서의 두 점 사이의 거리를 구하는 방법 입니다. 두 점의 RGB 수치의 차이를 3차원에서의 직선 거리로 표현하는 기법입니다. 직선 거리가 작으면 두 점 사이의 거리가 가깝기 때문에 색상의 유사성이 높다고 판단할 수 있습니다.

(2) 색상 비율 방식

색상 비율 방식은 각 채널의 상대적인 중요도를 강조하는 방법입니다. 색상의 전체적인 밝기나 강도가 아닌, 각 채널이 전체에서 차지하는 비중을 주목합니다. 이 때문에, 서로 다른 밝기나 채도를 가진 색상들이 유사하게 평가될 수 있습니다.

예를 들어, 두 색상 A(200, 200, 200)와 B(100, 100, 100)을 생각해보았을 때, 이 두 색상은 각각 밝은 회색과 어두운 회색입니다. 색상 비율 방식으로는 두 색상이 동일하게 평가될 수 있습니다(각 채널의 비율이 동일하기 때문). 그러나 실제로는 이 두 색상은 밝기 차이가 크게 나며, 시각적으로 큰 차이를 만들어냅니다.

</details>
<br />
실제 코드에서는 아래와 같이 구현했습니다.

```javascript
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

## 1-2. 부분 탐색만으로 조회하는 커스텀 로직 구현

클라이언트에서 보낸 색상과 가장 가까운 색상을 찾기 위해서 DB 전체를 탐색하는 것은 비효율적일 것입니다.
<br />
DB 전체를 탐색하지 않고 부분만 탐색해도 정확한 조회가 가능하도록 커스텀 탐색 로직을 구현했습니다.
<br />
R, G, B 값은 0부터 255까지로 표현됩니다. 이 R, G, B 값을 축으로 해서 아래 그림과 같은 3차원 공간으로 표현할 수 있습니다.

<img width="350" alt="rgb" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/935e5e11-ead1-483e-9daa-7c300140117c">

이 색상의 범위를 이용해서 R, G, B를 각각의 구역으로 나누어, 클라이언트에서 보낸 색상이 포함된 구역과 같은 구역에 해당하는 값만 거리를 비교하는 방법을 사용했습니다.

R, G, B를 각각 몇 개의 구역으로 나눌지 판단하기 위해 RGB 3차원 공간을 총 몇개의 구역으로 나누는지를 계산했습니다. 그리고 사진의 분포가 일정하다는 가정 하에 한 구역당 몇 개의 사진이 들어갈 지 계산했습니다.

|       | 총 구역의 갯수               | 한 구역 당 사진 수   |
| ----- | ---------------------------- | -------------------- |
| 5등분 | $$5 \times 5 \times5 = 125$$ | $678 \div 125 = 5$장 |
| 6등분 | $$6 \times 6 \times6 = 216$$ | $678 \div 216 = 3$장 |
| 7등분 | $$7 \times 7 \times7 = 343$$ | $678 \div 343 = 2$장 |

`5등분`씩 나누게 되면, 인접 구역 내에 사진이 많아져서, 거리 연산 횟수가 많아집니다.

`7등분`씩 나누게 되면, 한 구역에 사진이 없을 확률도 높아지고, 인접하는 구역 내에 사진이 없을 확률도 존재합니다. 즉, 가장 유사한 사진을 검색할 수 없을 확률이 존재합니다.

따라서 전체 R, G, B를 각각 `6등분`으로 나누었습니다. 밀도의 불균일성을 고려하더라도 한 구역에 1개 이상 있을 확률이 높다고 판단했습니다. 아래 사진을 보면 6개씩의 구역으로 나누었을 때의 DB의 분포를 볼 수 있습니다. 이 사진에서도 대부분의 구역에 데이터가 존재하는 것을 볼 수 있습니다.

<img width="300" alt="3d 산점도" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/9d23b183-9b50-4c82-9c60-403f87cc16e2">

<br />
<br />

### 1) 정확성을 위한 탐색 : 인접한 구역을 포함하기

### 탐색 속도 감소 vs 탐색 결과의 정확성

클라이언트에서 보낸 색상의 구역과 동일한 구역만 탐색하면 속도가 매우 빨라진다는 장점이 있습니다.

하지만 동일한 구역에 있는 사진들만 탐색한다면 탐색 결과의 정확성이 줄어듭니다.
같은 구역인 사진들 보다, 인접한 구역에 있는 사진들이 색상이 더 가까울 수 있기 때문입니다.

<img width="200" alt="인접" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/7ada337f-d509-4011-9ff9-12513450c4a6">

위 그림은 2차원으로 표현한 구역입니다. 클라이언트에서 보낸 색상을 분홍색 점으로 표시해두었습니다.
<br /> 이 점과 같은 구역에 속해 있는 녹색점 보다, 인접한 구역에 있는 보라색 지점과의 거리가 더 가까운 것을 볼 수 있습니다.
<br />
<br />
DB에 저장된 사진의 양이 678개로 많지 않아 정교한 색상을 표현하기 어려운 상황 속에서, 유사한 색상을 탐색해 보여 주어야 하는 프로젝트의 특성을 고려했을 때, 탐색의 속도보다는 정확성이 더 중요하다고 판단했습니다. 따라서 같은 구역 뿐만 아니라 인접한 구역까지도 함께 탐색해서 가장 유사한 색상을 탐색할 수 있도록 구현했습니다.
<br />
<br />

### 2) 인접한 구역을 계산하고 구역 내를 탐색하기

아래의 그림과 같이, 한 구역을 포함한 인접 구역의 갯수는 총 27개입니다.

<img width="250" alt="인접구역 갯수" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/5b205ee0-bfa7-47b8-b713-fb2dec3c820a">

(꼭지점 구역의 인접 구역은 8개, 모서리 구역의 인접 구역은 12개 입니다)

DB 전체(216개의 구역)을 모두 탐색하지 않고 최대 27개의 구역만 탐색할 수 있도록 구현해, 탐색 범위가 87.5% 감소하게 되었습니다.

- 인접한 구역을 계산하고 구역 내의 색상 값을 찾는 로직
  <br />
  <img width="429" alt="인접 구역 로직" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/fc4a7db7-dd88-4259-9cd3-6cc9dde856ad">
  <br />
  <img width="429" alt="타겟 그룹 로직" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/c054161e-04d7-4574-b66a-9e7cf4dc6af4">

<br />
<br />

## 1-3. K-D Tree 자료구조를 적용해서 탐색 로직의 일관성을 향상시키기

### 1. 기존 탐색 로직의 문제점

앞서 구현했던 커스텀 탐색 로직 방식에는 두가지 문제점이 있었습니다.

### 1) 사진을 더 많이 추가하게 되면 구역을 세분화 해야한다

6등분으로 나누었을 경우에는 27개의 구역 내에 있는 사진이 많지 않습니다. 따라서 사진을 추가해도 탐색 시간에 큰 차이는 없습니다.

하지만 지금보다 훨씬 많은 사진을 추가하게 되는 상황이 발생한다면, 6개의 구역으로 나누는 방식으로도 인접 구역 내에 많은 사진이 존재하게 됩니다.

이렇게 많은 사진이 추가되는 경우 그때 마다 구역의 갯수를 알맞게 나누고, 다시 구역에 따라 사진을 분류해야합니다. 연산 횟수 최적화를 하기 위해서 추가적인 분류를 해야하므로 연산 비용이 높습니다.

### 2) 색상에 따라 사진 탐색 시간이 불균일하다

아래 3d 산점도에 표시한 영역들을 보면 분포가 일정하지 않아 상대적으로 밀도가 높은 구역과 낮은 구역이 존재합니다.

<img width="350" alt="산점도 분포" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/71e0da5b-9900-4e00-ad5d-f03a4c7a9f96">

이렇게 상대적으로 밀도가 높은 구역에는 탐색 시간이 많이 소요되게 되고, 밀도가 낮은 구역의 경우에는 탐색 시간이 적게 소요됩니다.

<img width="800" alt="탐색 시간 (커스텀)" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/aeb1b5c9-7b9b-44c0-ac42-f9e20c7a6efc">

위 사진은 실제 탐색 시간을 측정한 결과입니다. 적게는 258ms에서부터 많게는 516ms까지 탐색 소요 시간의 분포가 일관되지 않은 것을 볼 수 있습니다.
<br />
커스텀 탑색로직에서의 탐색 시간의 표준편차는 78.84로 계산 되었습니다. 이처럼 탐색 시간이 일관되지 않다면, 탐색 결과의 신뢰성이 보장되지 않습니다.

<br />

### 2. K-D Tree 자료구조를 적용해서 탐색의 일관성을 높인다.

커스텀 탐색 로직을 사용하지 않고도, MongoDB 전체를 다 탐색하지 않고 정확하고 일관되게 탐색할 수 있는 방법을 찾아보았습니다.
<br/>

k-d tree 자료구조는 고차원 공간에서 가까운 이웃을 빠르게 검색하는 데 사용되는 자료구조 입니다. <br />
(여기서 '가까운 이웃'이란 유클리드 거리와 같은 거리 측정에 따라 결정됩니다.)

### k-d tree의 구현

k-d tree는 각 노드가 k차원의 한 점을 나타내며, 트리의 각 단계에서 한 차원에 대해 노드를 분할하여 구축됩니다.k-d tree는 효율적인 탐색을 위해 공간을 이진 탐색 트리와 유사한 방법으로 분할합니다.
<br />
<img width="234" alt="kdtree" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/01a3b424-36da-4e2d-b3ee-177ce1e3871d">

이 경우에는 R,G,B 각각을 축으로 사용하여 3차원 k-d tree를 만듭니다.
<br />
[구현 과정 링크](https://github.com/NayeongK/objecthorizon-server/blob/5884f521497171bc8ea66720e37328bed406093e/utils/kd-tree.js)
<br />

### k-d tree의 탐색

이렇게 만들어진 k-d tree를 탐색할 때는 트리를 재귀적으로 내려가면서 현재 노드와 목표 점 사이의 거리를 계산하고, 그 거리를 기반으로 가장 가까운 이웃을 찾습니다.
<br />
[구현 과정 링크](https://github.com/NayeongK/objecthorizon-server/blob/5884f521497171bc8ea66720e37328bed406093e/utils/kd-tree.js)

### k-d tree의 시간 복잡도

k-d tree의 시간 복잡도는 데이터 구조를 구축하는 데 O(nlogn) 이며, 이는 모든 데이터 점을 트리에 삽입하는 데 필요한 시간입니다.
<br />
탐색은 평균적으로 O(logn) 시간 복잡도를 가집니다.

k-d tree 자료구조를 이용한 방법으로 로직을 변경한 결과 다음과 같은 결과값을 얻을 수 있었습니다.

<img width="965" alt="탐색 소요 시간 (kdtree)" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/adecb310-49b4-4bcc-9ba6-45425ee6f73d">

소요시간의 표준편차는 26.46으로, 기존 커스텀 탐색로직의 표준편차 78.84에 비해 표준 편차가 감소 했으며, 표준편차의 감소율은 66.4%입니다.
<br />
적절한 자료구조로 변경하여 결과값의 일관성이 높아지면서 결과의 신뢰성도 높일 수 있게 되었습니다.

<br />

### 3. 외부 라이브러리 없이 K-D Tree 자료구조 구현하기

k-d tree 자료구조를 적용하도록 하는 라이브러리가 존재합니다(KDBush, kdtree 등) <br />
외부 라이브러리를 사용해서 자료구조를 적용하는 대신, 직접 자료구조를 구현해 보았습니다.

[전체 코드](https://github.com/NayeongK/objecthorizon-server/blob/main/utils/kd-tree.js)

### 1) k-d tree 구현하기

```javascript
function buildKDTree(points, depth = 0) {
  if (!points.length) {
    return null;
  }

  const k = points[0].length;
  const axis = depth % k;

  points.sort((a, b) => a[axis] - b[axis]);
  const median = Math.floor(points.length / 2);

  const node = {
    point: points[median],
    left: buildKDTree(points.slice(0, median), depth + 1),
    right: buildKDTree(points.slice(median + 1), depth + 1),
    axis: axis,
  };

  return node;
}
```

<br/>

### 2) 가장 가까운 원소 찾기

```javascript
function closestPoint(node, point, best = null) {
  if (node === null) {
    return best;
  }

  const d = distanceSquared(node.point, point);
  const dx = node.point[node.axis] - point[node.axis];
  let bestPoint = best;

  if (best === null || d < distanceSquared(best, point)) {
    bestPoint = node.point;
  }

  if (dx > 0) {
    bestPoint = closestPoint(node.left, point, bestPoint);
  } else {
    bestPoint = closestPoint(node.right, point, bestPoint);
  }

  if (dx ** 2 < distanceSquared(bestPoint, point)) {
    if (dx > 0) {
      bestPoint = closestPoint(node.right, point, bestPoint);
    } else {
      bestPoint = closestPoint(node.left, point, bestPoint);
    }
  }

  return bestPoint;
}
```

<br />
<br />

# 2. 이미지를 효율적으로 저장하고 요청하기

## 2-1. 자동화 스크립트를 이용해 저장하기

### 이미지의 어떤 색상을 추출할까?

줌 이후에 나오는 이미지를 자연스럽게 느끼기 위해서는, 다음 이미지의 색상 유사성이 중요하다는 생각이 들었습니다.
<br />
하지만 이미지에는 많은 픽셀과 색상들이 존재합니다.
이미지 전체의 수 많은 픽셀중 어떤 픽셀을 기준으로 대표 색상을 선택해야 다음 사진의 색상이 유사하다고 느낄 수 있을 지 고민했습니다.

1)이미지의 `전체`의 픽셀 중 가장 빈도가 높은 색상
<br /> 2)이미지의 `배경`의 픽셀 중 가장 빈도가 높은 색상
<br />

<img width="600" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/2546275b-0177-43a4-9e57-1fd0bc6c13e0">
<br />

위 그림을 보았을 때, 사진 전체에서 빈도가 높은 색상을 기준으로 하는 것 보다, 배경색이 같은 경우의 색상 변화를 더 자연스럽게 느낀다는 판단이 들었습니다. 따라서 배경의 색상 중 가장 많은 색상을 기준으로 대표 색상을 결정하는 방법을 선택했습니다.

### 이미지의 색상을 어떻게 추출할까?

가장자리의 픽셀값을 사용해서 가장 빈도가 높은 색상을 대표 색상으로 추출하는 로직은 아래와 같습니다

<details>
<summary>가장자리 픽셀 추출 로직</summary>

```javascipt
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

<br />
이렇게 추출한 가장자리의 색상을 서버를 통해 DB에 저장하게 됩니다.
과정의 도식은 아래와 같습니다.
<br />
<img width="500" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/d6011c40-be36-4cb3-8b22-80a3ad46cb29">

## 2-2. 중복 요청을 방지하기

### 1. pre-fetching에서의 중복 요청을 방지하기

### 1) 다음 이미지를 미리 요청하기 : pre-fetching

사물의 지평선은, 일정 비율 이상으로 이미지를 확대할 때, 중심 위치의 색상을 추출하고, 추출한 색상을 서버에 전송하여 가장 가까운 색상을 가진 이미지를 요청합니다.
<br />
<img width="500" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/2ecc2fb9-b534-4548-8905-e5388a685da3">
<br />

이 기능을 구현하기 위해서 아래와 같은 이유로, 다음 이미지를 미리 요청할 필요가 있었습니다.

#### (1) 비동기 렌더링 딜레이를 고려하여

이미지를 확대하기 위해 새로운 이미지를 서버에서 요청하는 동안, 사용자는 빈 화면을 보게 됩니다. 이러한 딜레이는 사용자 경험을 저하시킬 수 있으며, 사용자가 대기하는 동안 불편함을 느낄 수 있습니다.

#### (2) 색상 일치성을 고려하여

이미지를 크게 확대하면 이미지의 중심과 배경이 모두 비슷한 색상을 띄게 됩니다. 실제로 600배 확대한 경우, 대부분의 색상이 유사한 계열의 색상으로 구성되어 있음을 확인했습니다. 따라서 사용자 경험을 향상시키기 위해 600배 확대 시점에서, 다음 이미지를 미리 요청하는 것이 적절하다고 판단하였습니다.

<br />
<img width="630" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/7c017518-221b-4b7b-9232-9031b5a243e1">
<br />

이미지를 600배 확대하는 시점에서 미리 다음 이미지를 요청함으로써, 실제 다음 이미지로 전환되기 전인 2000배 확대까지의 시간 동안 fetch 작업에 여유 시간을 확보할 수 있습니다. 이렇게 함으로써 이미지 전환이 자연스럽고 빠르게 이루어질 수 있었습니다.

### 2) pre-fetching에서의 중복 요청을 방지하기

사용자의 터치패드의 이벤트를 이용해서 확대 비율을 계산하게 됩니다.

#### (1) 줌 계산 로직

```javascript
let scale = -e.deltaY * 0.01;
let currentZoom = viewState.zoom;
let newZoom = currentZoom * (1 + scale);
```

`scale`은 사용자의 마우스 휠 이벤트(e.deltaY)에 따라서, 확대/축소 정도를 계산합니다.
`currentZoom`은 현재의 확대/축소 정도를 나타내며, 이전 상태의 값을 의미합니다.
`newZoom`에 scale 된 정도를 곱하기 위해 1 + scale을 곱해주면, 새로운 확대/축소 정도를 계산할 수 있습니다. 사용자가 마우스의 휠을 움직일 때마다 이전 정도에 누적된 값을 얻을 수 있습니다.

#### (2) 600배 이상일때 요청하기

따라서 zoom은 대부분 정수가 아닌 소수점을 가진 실수로 계산되고, 정확히 600이 되는 순간을 기준으로 한다면 대부분의 경우 서버에 요청을 보내지 못하게 됩니다.
이를 해결하기 위해 sentColor 변수를 사용했습니다. 요청 유무를 boolean으로 상태값으로 관리하여, zoom이 600을 초과하면서도 아직 요청을 보내지 않은 경우에만 요청할 수 있도록 구현했습니다.

```javascript
if (newZoom > 600 && !sentColor) {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const centerColor = ctx.getImageData(centerX, centerY, 1, 1).data;

  async function fetchNextImage() {
    const nextImage = await fetchClosestBackgroundImage(centerColor);
    if (nextImage && nextImage.url) {
      setImages((currentImages) => {
        const updatedImages = [...currentImages, nextImage.url];
        return updatedImages;
      });
      setViewState((currentViewState) => ({
        imageIndex: images.length,
        zoom: 1,
      }));
    }
  }
  fetchNextImage();
  setSentColor(true);
}
```

<br />

### 2. 이미지 캐싱을 이용해서 이미지 렌더링 시 중복 요청 방지하기

#### 1) 이미지 객체란?

Canvas API를 이용해서 이미지를 렌더링하기 위해서는 이미지 데이터가 필요합니다. 이때 Image 객체를 사용합니다. Image 객체는 웹에서 이미지를 표현하는 표준적인 방법으로, 브라우저가 이미지 데이터를 로드하고 렌더링할 수 있게 합니다.

웹 애플리케이션에서 이미지를 로드하는 과정은 비동기적입니다. 즉, 이미지 로딩이 시작되고 완료되기까지 다른 코드의 실행이 중단되지 않습니다. 이러한 비동기적인 특성을 관리하기 위해 Image 객체가 사용됩니다.

Image 객체를 생성하고 src 속성에 URL을 할당하면, 이때 브라우저는 해당 URL로부터 이미지 데이터를 불러오기 위한 HTTP 요청을 시작합니다. 즉, 브라우저는 해당 URL로부터 이미지를 로드하기 시작합니다. 이 과정은 비동기작업이며, 이미지 크기나 네트워크 속도에 따라 로드 시간이 달라질 수 있습니다.

이미지가 완전히 로드되었을 때 작업을 수행하기 위해, Image 객체의 load 이벤트 리스너를 사용할 수 있습니다. image.addEventListener("load", callback)을 통해 이미지 로딩이 완료되었을 때 호출될 콜백 함수를 설정할 수 있습니다. 이를 통해 이미지가 완전히 로드된 후에 캔버스에 그릴 수 있습니다

#### 2) 이미지를 캐싱하기

이와 같이 Image 객체의 src 속성에 URL을 할당하는 것은 매번 이미지를 중복으로 로드 하는 것과 같습니다. 기존 useEffect내의 의존성 값인 image나 zoom이 바뀔 때마다 이 할당문이 실행이 된다면, 이미지가 바뀌거나 확대 정도가 바뀔 때 마다 새로운 네트워크 요청이 발생하게 됩니다.

<img width="550" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/f7686e7b-697d-4a73-8afd-02562f08f729">

이미지와 확대 정도를 함께 고려해서 캔버스에 그리고 이를 같은 useEffect내의 의존성 값으로 다루다보니, 확대가 되었을 때 이미지 요청이 중복되는 현상이 발생했습니다.

위 사진은 performance 탭에서 네트워크 요청을 확인한 결과 입니다. 녹색으로 표시 된 부분이 이미지 객체에 url을 할당하면서 일어나는 네트워크 요청이었습니다. 이렇게 같은 사진 내에서도 중복으로 요청이 발생하는 것을 확인할 수 있었습니다.

이를 해결하기 위해서, 이미 불러온 이미지가 있는지 확인한 후, 이미 존재하면 네트워크 요청을 하지 않고 메모리에 캐시된 이미지를 사용했습니다. 즉, 이미 불러온 이미지의 참조를 저장한 다음, 캐시된 이미지가 있으면 재사용하여 동일한 이미지에 대한 중복 요청을 방지했습니다.

이 방법을 통해 컴포넌트가 재렌더링 될 때마다 발생할 수 있는 불필요한 네트워크 요청을 효과적으로 줄일 수 있습니다. useEffect 훅이 의존성 배열에 있는 이미지와 줌이 변경함에 따라 호출이 되더라도, 이미 로드된 이미지는 새로운 HTTP 요청을 하지 않아 불필요한 네트워크 트래픽을 줄이고 자연스러운 이미지 렌더링에도 도움이 됩니다.
<br />

<details>
<summary>코드 구현 내용</summary>

```javascript
useEffect(() => {
  function loadImage(imageIndex) {
    const src = images[imageIndex];
    if (!imageElements[src]) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.addEventListener("load", () => {
        setImageElements((prev) => ({ ...prev, [src]: image }));
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        drawImage(canvas, ctx, image, viewState.zoom);
      });
    } else {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      drawImage(canvas, ctx, imageElements[src], viewState.zoom);
    }
  }

  if (images.length > 0) {
    loadImage(viewState.imageIndex);
  }
}, [mousePosition, images, viewState, imageElements]);
```

</details>
<br />
<img width="550" alt="image" src="https://github.com/NayeongK/objecthorizon-client/assets/80331804/5f61b1ff-b1b6-4bb6-9bbd-234b170df7cc">

변경한 로직으로 performance 탭을 확인한 결과, 네트워크 요청(녹색 막대)이 중복해서 일어나지 않도록 변경되었습니다.

# 3. 이미지 렌더링 최적화하기

## 3-1. 부드러운 이미지 확대 효과 구현하기

> 사용자의 줌 모션에 따라 `휠 이벤트`가 발생합니다. <br />
> 이 이벤트에 따라 이미지가 부드럽게 확대 또는 축소 되어야합니다. <br />
> 줌으로 발생하는 이벤트와 이미지의 확대 타이밍을 조절해서, 이미지를 자연스럽게 확대하는 방법을 고민 했습니다.

### 1. throttle과 requestAnimationFrame

#### 1) throttle을 이용한 이벤트 처리

`throttle`이란, 이벤트를 일정 주기로 제한해서 처리할 수 있도록 하는 방법입니다. <br />
처음에는 사용자의 줌인 모션으로 인해 발생하는 휠 이벤트를 throttle을 이용하여 처리하고 있었습니다. <br />
그러나, throttle을 사용하더라도 사용자의 확대 모션으로 인해 여러 휠 이벤트가 빠르게 발생했습니다. <br />
이로 인해 각각의 휠 이벤트가 중첩되어 발생하고, 이로 인해 이미지의 확대 효과가 부자연스러운 문제가 발생했습니다.

![throttle loop](https://github.com/NayeongK/objecthorizon-client/assets/80331804/2e6b01a0-616b-4b24-802d-dfff9af23607)
<br />
이렇게 throttle로 구현된 줌 렌더링의 경우, 화면 렌더링이 부자연스럽거나 끊기는 현상이 발생합니다.
<br />
[해당 코드](https://github.com/NayeongK/objecthorizon-client/blob/2857b1694e8c1be699a834696b7ebca565f4d5b1/src/components/ImageLayout/index.jsx#L134)
<br />

#### 2) requestAnimationFrame을 이용한 개선

`requestAnimationFrame`은 브라우저의 다음 렌더링 주기 전에 콜백 함수를 실행하는 방법입니다. <br />
휠 이벤트와 이미지 확대를 브라우저의 렌더링 주기와 동기화하여 처리할 수 있습니다.
<br /> requestAnimationFrame을 이용해서 줌 렌더링의 주기와 브라우저 렌더링 주기를 맞추어, 사용자의 확대 모션에 따라 이미지가 자연스럽게 확대될 수 있었습니다.
<br />
<br />
![rAF loop](https://github.com/NayeongK/objecthorizon-client/assets/80331804/dad753cd-5906-4bb1-927f-b3d4b7ce2fac)
<br />
requestAnimationFrame으로, 줌에 따른 이미지 확대가 자연스럽게 렌더링 됩니다.

<br />

### 2. requestAnimationFrame 최적화하기

requestAnimationFrame을 사용하면서도, 더 부드러운 줌 렌더링을 위해서 최적화를 진행했습니다.

#### 1) animation frame 이란?

애니메이션 프레임은 브라우저의 내부적인 큐로, 일반적인 비동기 작업(Task Queue)과 별개로 관리됩니다. 이 큐에는 requestAnimationFrame 함수를 통해 등록한 콜백 함수들이 담겨 있습니다.
<br />
<br />
requestAnimationFrame을 통해 등록한 콜백 함수들은 순서대로 실행되며 중첩되지 않습니다. 또한, 이전에 예약된 프레임을 취소하거나 새로운 프레임을 예약할 수 있어서 제어가 가능합니다. 부드러운 애니메이션 및 사용자 입력 처리에 유용합니다.

#### 2) frame 이란?

브라우저는 1초당 몇 개씩의 프레임(frame per second: fps, hz, 주사율)을 그려 화면을 표시합니다. 브라우저는 모니터의 주사율에 따라 프레임을 표현합니다.

#### 3) frame id란?

requestAnimationFrame 함수를 호출하면 요청마다 고유한 아이디 값이 반환 됩니다.
이 아이디를 이용해서 예약된 프레임을 제거할 수 있습니다. 제거하는 경우 cancelAnimationFrame을 사용합니다.

```javascript
function handleWheel(event) {
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
  }
  const id = window.requestAnimationFrame(() => {
    handleWheelEvent(event);
  });
  setAnimationFrameId(id);
}
```

휠 이벤트는 많은 이벤트가 발생하기 때문에 동일한 이벤트에 requestAnimationFrame를 여러번 호출하지 않도록 하는 것이 필요합니다. 애니메이션 프레임이 실행중이지 않을 때에만, 코드가 실행됩니다.

<br />

## 3-2. 마우스 위치를 기준으로 확대하기

### 1. 확대 지점을 어떻게 계산할까?

### 1) 마우스가 위치한 사진의 지점이 확대되도록 하는 방법

사용자가 마우스를 이용해서 확대할 지점을 선택 수 있도록 구현했습니다.
마우스 방향으로 자연스럽게 확대되도록 하기 위해서는 마우스의 위치가 화면에 중앙에 오는 것이 아니라, 마우스가 놓여진 지점을 향해 자연스럽게 확대되는 방식이 자연스럽다고 생각했습니다. 이 기능을 구현하기 위해서 여러 단계로 나누어 작업했습니다.

### 1단계 : 마우스의 위치를 추적하기

```javascript
useEffect(() => {
  const canvas = canvasRef.current;

  function handleMouseMove(e) {
    setMousePosition({ x: e.clientX, y: e.clientY });
  }

  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("wheel", handleWheel, { passive: false });
}, [viewState.zoom]);
```

이 코드는 canvas 요소에 마우스 이동(mousemove)과 휠(wheel) 이벤트를 감지하고 처리하는 로직입니다.

e.clientX와 e.clientY는 이벤트 객체 e의 속성으로, 현재 마우스 포인터의 위치를 브라우저 화면의 X, Y 좌표로 나타 냅니다.

> clientX: 브라우저 화면의 가로축에 대한 마우스 포인터의 위치입니다. 화면의 왼쪽 가장자리로부터의 거리를 픽셀 단위로 나타냅니다.
> <br />
> clientY: 브라우저 화면의 세로축에 대한 마우스 포인터의 위치입니다. 화면의 상단 가장자리로부터의 거리를 픽셀 단위로 나타냅니다.

이 방법을 사용하면 마우스의 위치를 알 수 있습니다.
handleMouseMove 함수에서 마우스의 현재 위치를 setMousePosition로 업데이트 합니다.
이 마우스의 위치는 확대 / 축소의 중심점 계산 로직을 계산하는데 사용 됩니다.

### 2단계 : 확대 / 축소 정도 계산하기

```javascript
function handleWheelEvent(e) {
  const scale = -e.deltaY * 0.01;
  const currentZoom = viewState.zoom;
  const newZoom = currentZoom * (1 + scale);
  // 중략
}
```

노트북 터치패드를 사용한 핀치 줌은 마우스의 휠 이벤트를 사용해서 구현할 수 있습니다.
<br />
<br />
`e.deltaY`를 사용하면 마우스 휠의 방향과 속도를 감지할 수 있습니다.
<br />

> 아래로 스크롤 하면(또는 핀치 줌으로 확대 모션을 하면) deltaY는 양수이고,
> <br />
> 위로 스크롤하면 (또는 핀치 줌으로 축소 모션을 하면) deltaY는 음수입니다.

`scale` 변수는 deltaY에 기반하여 확대/축소 비율을 결정합니다. (-e.deltaY \* 0.01)
<br />
`viewState.zoom` 값은 현재 확대/축소 상태를 나타냅니다. 이 값에 scale을 곱하여 새로운 확대/축소 비율인 `newZoom`을 계산할 수 있습니다.

### 3단계 : 확대 / 축소에 따른 이미지 그리기

<details>
<summary>구현된 코드</summary>

```javascript
function drawImage(canvas, ctx, image, zoomValue) {
  // 캔버스의 너비와 높이를 브라우저 창의 크기로 설정
  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // 이미지의 비율을 계산
  const imgRatio = image.width / image.height;

  // 확대/축소된 이미지의 너비를 계산
  let drawWidth = canvasWidth * zoomValue;
  // 확대/축소된 이미지의 높이를 이미지 비율에 맞추어 계산
  let drawHeight = drawWidth / imgRatio;

  // 마우스 위치를 기준으로 이미지의 X, Y 시작점을 계산
  const offsetX = (mousePosition.x - canvasWidth / 2) * (zoomValue - 1);
  const offsetY = (mousePosition.y - canvasHeight / 2) * (zoomValue - 1);

  // 이미지가 캔버스 중앙에 위치하도록 X 시작점을 계산하고, 마우스 위치에 따라 조정한다
  let startX = (canvasWidth - drawWidth) / 2 - offsetX;
  // 이미지가 캔버스 중앙에 위치하도록 Y 시작점을 계산하고, 마우스 위치에 따라 조정한다
  let startY = (canvasHeight - drawHeight) / 2 - offsetY;

  // 이미지가 캔버스를 벗어나지 않도록 X,Y 시작점을 조정한다
  if (startX > 0) {
    startX = 0;
  }
  if (startY > 0) {
    startY = 0;
  }
  if (startX + drawWidth < canvasWidth) {
    startX = canvasWidth - drawWidth;
  }
  if (startY + drawHeight < canvasHeight) {
    startY = canvasHeight - drawHeight;
  }

  // 계산된 시작점과 크기로 캔버스에 이미지를 그린다
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(image, startX, startY, drawWidth, drawHeight);
}
```

</details>
<br />

`drawImage` 함수는 확대/축소한 이미지를 canvas에 그립니다.

`캔버스 크기 설정`: 먼저 브라우저 창의 크기(window.innerWidth, window.innerHeight)를 사용하여 캔버스의 크기를 설정합니다.

`이미지 비율 계산`: imgRatio는 이미지의 가로세로 비율을 나타냅니다. 이를 사용하여 캔버스 크기에 맞춰 확대/축소할 이미지의 크기를 결정합니다.

`확대/축소된 이미지 크기 계산`: zoomValue를 사용하여 확대/축소된 이미지의 크기(drawWidth, drawHeight)를 계산합니다.

`이미지 위치 결정`:
마우스 위치(mousePosition.x, mousePosition.y)를 사용하여 확대 중심점을 계산합니다.
offsetX와 offsetY는 마우스 위치를 기준으로 확대할 때 이미지가 얼마나 이동해야 하는지를 나타냅니다.
startX와 startY는 이미지가 캔버스에 그려질 시작 위치입니다. 이는 확대 중심점을 기준으로 계산됩니다.
이미지가 캔버스 밖으로 나가지 않도록 경계값을 체크합니다.

<details>
<summary> offset X,Y와 startX, Y의 계산</summary>

### 마우스 위치에 기반한 오프셋 계산 (offsetX, offsetY)

마우스 위치 오프셋 계산 (offsetX, offsetY)

1. 마우스 위치 계산
   마우스가 캔버스 중앙으로부터 얼마나 멀리 위치해 있는지를 나타냅니다.
   마우스의 x좌표에서 캔버스 너비의 절반을 빼면, x좌표가 캔버스 중앙으로부터 얼마나 멀리 위치해있는지 알 수 있습니다. 같은 방법으로 y도 중앙으로부터 얼마나 멀리 위치해있는지 구할 수 있습니다.

   ```
   mousePosition.x - canvasWidth / 2
   mousePosition.y - canvasHeight / 2
   ```

2. 확대 비율을 곱해서 확대 정도에 따른 마우스의 위치를 구하기

   ```
   const offsetX = (mousePosition.x - canvasWidth / 2) * (zoomValue - 1);
   const offsetY = (mousePosition.y - canvasHeight / 2) * (zoomValue - 1);
   ```

   마우스 위치에 따른 X축 오프셋에 확대/축소 비율을 적용합니다. 확대 정도에 따라 마우스 위치에서 이미지가 얼마나 멀리 이동해야 할지를 결정 하도록 합니다.
   예를 들어, 확대가 클수록 (zoomValue가 크면), 마우스 위치에서 멀어지는 정도도 커지며, 이미지는 마우스 위치를 중심으로 더 넓게 확대됩니다.

### 이미지 시작점 계산 (startX, startY)

```
startX = (canvasWidth - drawWidth) / 2 - offsetX
startY = (canvasHeight - drawHeight) / 2 - offsetY
```

확대된 이미지가 캔버스의 가운데에서 시작하도록 계산한 후, offsetX만큼 이미지를 이동시킵니다.
<br /> 즉, 마우스가 캔버스의 오른쪽에 있으면 이미지는 왼쪽으로 이동합니다.<br />
마우스가 캔버스의 아래쪽에 있으면 이미지는 위로 이동합니다.

</details>

<br />
<br />

### 2) 축소 시 이미지 위치를 조정하기

마우스의 위치를 기준으로 캔버스에 그려지는 로직으로 인해, 축소 시에는 이미지의 위치가 틀어지는 현상이 발생했습니다.
<br />
![확대 후 축소 변경 전](https://github.com/NayeongK/objecthorizon-client/assets/80331804/2292d6e9-7e92-4d37-8eed-05d017ed55a4)

### 확대하는 경우와 축소되는 경우를 분기처리

```javascript
if (zoomValue > 1) {
  // 확대할 때
  const offsetX = (mousePosition.x - canvasWidth / 2) * (zoomValue - 1);
  const offsetY = (mousePosition.y - canvasHeight / 2) * (zoomValue - 1);

  let startX = (canvasWidth - drawWidth) / 2 - offsetX;
  let startY = (canvasHeight - drawHeight) / 2 - offsetY;

  if (startX > 0) startX = 0;
  if (startY > 0) startY = 0;
  if (startX + drawWidth < canvasWidth) startX = canvasWidth - drawWidth;
  if (startY + drawHeight < canvasHeight) startY = canvasHeight - drawHeight;
} else {
  //축소할 때
  startX = (canvasWidth - drawWidth) / 2;
  startY = (canvasHeight - drawHeight) / 2;
}
```

### 축소 시 이미지 위치 계산

```javascript
startX = (canvasWidth - drawWidth) / 2;
startY = (canvasHeight - drawHeight) / 2;
```

이미지가 정중앙에 위치하도록 하기 위해서, 이미지의 위치를 계산해야합니다.
<br />

> startX는 이미지가 시작되는 좌표입니다.
> startX는 (canvasWidth - drawWidth) / 2로 계산됩니다.
> <br />
> canvasWidth - drawWidth는 캔버스 너비에서 이미지 너비를 빼고 남은 공간입니다.
> <br />
> 이 남은 공간을 2로 나누어 양쪽에 균등하게 배치하면 이미지가 캔버스 가로의 중앙에 위치하게 됩니다
> <br />
> 이미지 시작점의 Y 좌표(startY)도 같은 방법으로 (canvasHeight - drawHeight) / 2 로 계산합니다.
> <br />
> 이렇게 계산된 위치에 ctx.drawImage 함수를 사용하여 이미지를 그리면, 이미지는 캔버스의 정중앙에 위치하게 됩니다. 이는 캔버스의 가로와 세로 중앙에서 이미지의 너비와 높이의 절반만큼씩 오프셋을 적용한 것과 같습니다.

이 로직을 사용해서
zoomValue가 1보다 클 때는 마우스 위치를 기준으로 확대하도록 하고,
<br />
zoomValue가 1이하일 때는 화면의 중앙에 고정되도록 해서 축소 시에 사용자 경험을 개선시켰습니다.

![축소 변경 후 (흰색)](https://github.com/NayeongK/objecthorizon-client/assets/80331804/ba466ae7-2d9f-482d-beb3-ab86f32521f3)
<br />
<br />

## 3-3. 크로스 브라우징 이슈 해결

Safari에서는 Wheel 이벤트를 인식하지 못하는 문제가 있었습니다.

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
<br />
<br />

# ⏰ TimeLine

프로젝트 기간 : 23.08.07 - 23.09.07(총 31일, 기획 및 설계 8일, 개발 및 마무리 23일)

<br />

# ⚙️ Tech Stack

**Client**:
<img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=React&logoColor=white">

**Server**:
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white">
<img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=Express&logoColor=white">
<img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=MongoDB&logoColor=white">
<img src="https://img.shields.io/badge/AmazonS3-569A31?style=for-the-badge&logo=AmazonS3&logoColor=white">

**Test**:
<img src="https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=Jest&logoColor=white">
<img src="https://img.shields.io/badge/React Testing Library-E33332?style=for-the-badge&logo=TestingLibrary&logoColor=white">
<img src="https://img.shields.io/badge/Supertest-569A31?style=for-the-badge&logo=&logoColor=white">

**Deployment**:
<img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=Netlify&logoColor=white">
<img src="https://img.shields.io/badge/AWS Elastic Beanstalk-FF9900?style=for-the-badge&logo=&logoColor=white">

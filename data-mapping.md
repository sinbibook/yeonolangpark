# Data Mapping 정의서 (trip-template-F 기반)

`standard-template-data.json` 기준 각 HTML 페이지의 `data-*` 속성 매핑 정의.
이 프로젝트는 trip-template-F 디자인을 가져와 표준 데이터 구조에 맞춰 매핑한다.

---

## 구현 주의사항

- 각 페이지 mapper(`js/data-mapper/pages/*.js`)는 아래 정의를 기준으로 `data-*` 속성을 탐색해 데이터를 주입한다.
- 헤더/푸터는 `common/header.html`·`common/footer.html`로 분리되어 `js/header-footer-loader.js`가 동적 주입한다. 헤더/푸터 매핑은 `header-footer-mapper.js`가 `headerFooterLoaded` 이벤트에서 수행.
- 슬라이더(Swiper)는 동적 슬라이드 주입 후 `window.initSwipers()`를 재호출해 재생성한다(`js/custom.js`).
- 색상/폰트(테마)는 `styles/theme.css` 기준이며 **본 문서 매핑 대상에서 제외**(별도 지시 시 작업).
- 이미지가 없으면 `ImageHelpers.applyPlaceholder()`(`<img>`) 또는 배경이미지 기본값 유지로 처리.

### 진행 현황

- [x] common/header.html, common/footer.html (동적 분리 + 매핑)
- [x] SEO / 메타 (전 페이지 공통)
- [x] index.html
- [x] main.html
- [x] directions.html
- [x] layout-map.html (= ROOMS 미리보기)
- [x] room.html
- [x] facility.html
- [x] reservation.html
- [x] nearby-attractions.html (주변여행지)
- [x] 팝업 (homepage.customFields.popup.popups)
- [x] 404.html (리다이렉트용, D 스타일 재구현)

---

## 공통 상수

### totalRoomCount 한글 변환 테이블

```js
const ROOM_COUNT_LABELS = {
  bedroom: '침대룸',
  bathroom: '화장실',
  livingRoom: '거실',
  ondol: '온돌룸',
  kitchen: '주방'
};
```

값이 1 이상인 항목만 나열. `roomStructures`와 조합:

```
roomStructures[0] + "/ " + 값≥1인 항목들 나열
예) "원룸형/ 침대룸 화장실 주방"
```

### 이미지 선택 규칙

- `isSelected === true` 인 이미지를 `sortOrder` 순으로 사용.
- `customFields.roomtypes[].images` 는 `category`(`roomtype_thumbnail`/`roomtype_interior`/`roomtype_exterior`)로 구분.

---

## common/header.html

> F 메뉴 구조: ABOUT(펜션소개/외경보기) · ROOMS · SPECIAL · RESERVE 4개. PC lnb / 모바일 aside / 전체메뉴(allmenu-wrap) **3곳에 동일 메뉴**가 존재하므로 동적 매핑은 모든 인스턴스에 적용된다.

| data-\* 속성       | 요소                                         | JSON 경로                                                                      |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------------------------ |
| `data-logo`        | 기본 로고 `<a>` (`.logo` / 배경이미지)       | `homepage.images[0].logo[0].url` — isSelected 우선 (없으면 empty placeholder)  |
| `data-logo-scroll` | 스크롤 시 로고 `<a>` (`.logo2` / 헤더 `.on`) | `homepage.images[0].logo[1].url` — 로고 1개면 `data-logo`와 동일 이미지 재사용 |

> **로고 색상 자동 보정** — 로고를 1개만 등록해도 헤더 상태에 따라 색이 바뀐다.
> `HeaderFooterMapper.tintLogo()`가 로고의 알파 채널을 CSS `mask`로 넘겨 **모양만 보존하고 색을 갈아끼운다**(`.is-logo-tinted`).
>
> 색상은 `styles/style.css`의 `.is-logo-tinted` 규칙에서 지정한다:
>
> | 상태                            | 색상                                                        |
> | ------------------------------- | ----------------------------------------------------------- |
> | 최상단 (투명 헤더)              | `#fff`                                                      |
> | 스크롤 (`.header.on` / 흰 배경) | `var(--color-secondary)` — 백오피스 테마 색을 그대로 따라감 |
>
> 적용 조건: 투명 배경 로고(`ImageHelpers.analyzeImage()`로 판정, 투명 픽셀 15% 이상)
>
> - 이미지 호스트 CORS 허용 + 브라우저 `mask` 지원.
>   하나라도 불충족이면 보정 없이 원본 로고를 그대로 쓴다(기존 동작).
>   | `data-booking-link` | 예약하기 `<a>` (PC/aside/allmenu + 모바일 플로팅, href 직접 주입) | `property.realtimeBookingId` |
>   | `data-ybs-button` | YBS `<a>` (PC/MO) | `property.ybsId` (없으면 숨김, `https://www.yapen.co.kr/external?ypIdx={ybsId}`) |
>   | `data-rooms-submenu` | ROOMS 서브메뉴 컨테이너 `<ul>` (3곳) | — (동적 생성 기준점) |
>   | `data-room-menu-link` | 미리보기 링크 (`/layout-map.html`) | — (동적 생성 앵커, 이 뒤에 객실 `<li>` 추가) |
>   | `data-facility-menu-link` | SPECIAL 서브메뉴 컨테이너 `<ul>` (3곳) | `property.facilities[].name` (컨테이너 비우고 동적 생성) |
>   | `data-menu-id="layout-map"` | ROOMS > 미리보기 `<li>`(=layout-map) | `customFields.pages.layoutMap.sections[0].enabled` (false면 숨김) |
>   | `data-allmenu-bg` | 전체메뉴(allmenu-wrap) 오버레이 배경 `.bg02` | `property.images[0].thumbnail[isSelected][0].url` (없으면 exterior → placeholder) |
>   | `data-travel-menu` | ABOUT > 주변관광지 `<li>` (3곳, 오시는길 아래) | `customFields.pages.nearbyAttractions.sections[0].enabled` (false면 숨김) |

- ROOMS 서브메뉴: `customFields.roomtypes[].name` 기준 `<li><a href="room.html?room_id={id}">` 생성.
- SPECIAL 서브메뉴: `property.facilities[].name` 기준 `<li><a href="facility.html?id={id}">` 생성.
- **우측 하단 플로팅 버튼**(`common/header.html`): 예약하기 `.ft_btn_reserve.for_m`(talk.png, `data-booking-link`, 모바일만) + 상담하기 `#talk_custom_button`(consult.png, `data-consult-button`, 총판A + tripPropertyId 일 때). 다른 템플릿과 같은 구현.
- **모바일 헤더 예약 아이콘**(`.btn_reserve`, `data-booking-link`): 특가 배지(`price.png`) + 예약 아이콘(`mbt_reserve01.png`, 스크롤 시 `mbt_reserveo01.png`). ≡ 왼쪽, YBS 오른쪽.
- 예약 버튼 시계 아이콘(`.main_reserve`/`room`/`allmenu`)은 `::before` 마스크로 `var(--color-secondary)` 적용(호버 시 흰색).

### 헤더 네이버·인스타그램 버튼 (`homepage.socialLinks`)

| data-\* 속성                            | 요소                                   | JSON 경로                                        |
| --------------------------------------- | -------------------------------------- | ------------------------------------------------ |
| `data-homepage-socialLinks-blog`        | 네이버 버튼 `<a>` (`.hd_sns_btn` 안)   | `homepage.socialLinks.blog` (없으면 숨김)        |
| `data-homepage-socialLinks-instagram`   | 인스타그램 버튼 `<a>` (`.hd_sns_btn` 안) | `homepage.socialLinks.instagram` (없으면 숨김) |
| `data-social-wrap`                      | 두 버튼 래퍼 `.hd_sns_btn`             | 보이는 버튼이 없으면 래퍼째 숨김                 |

- `HeaderFooterMapper.mapSocialLinks()`(mapPage 에서 호출)가 `facebook / instagram / blog / youtube` 4종을 처리한다.
  값이 있으면 `href` + `target="_blank" rel="noopener"` 를 넣고 노출, `null`·빈 문자열·공백·키 없음이면 숨긴다.
  D형 헤더 마크업은 blog(네이버)·instagram 두 개. 마크업은 `style="display: none"` 으로 시작(매핑 전 깜빡임 없음).
- 헤더에 버튼이 하나라도 보이면 루트(`<html>`)에 `data-social="on"`, 아니면 `"off"`.
- 위치·크기: 원본 스킨의 `.hd_sns_btn` 훅(최상단 숨김 · 스크롤 헤더에서만 노출)을 그대로 쓴다.
  - PC(≥1000): **스크롤 헤더(`.header.on`)에서만** `메뉴 | 예약하기 | YBS | [N][인스타] | ≡`, 32px, 간격 10px, YBS 와 15px.
    최상단(투명 헤더)에서는 보이지 않는다.
  - 1000~1100px 스크롤 헤더: 소셜이 보이면(`data-social="on"`) 메뉴 여백을 `0 20px / 0 20px` → `0 8px / 0 14px` 로 줄여
    ABOUT 이 로고 영역과 겹치지 않게 한다.
  - 모바일(≤999): 최상단·스크롤 모두 YBS 아이콘 왼쪽 `[N][인스타] YBS ≡`(absolute right:157px), 26px, 간격 8px.
    YBS 가 없으면(`a.ybs` 가 `display: none`) right:64px 로 당겨 `[N][인스타] ≡`.
- 어드민 프리뷰 `section_update` 의 `section === 'socialLinks'` 는 `pages[page].sections[0]` 이 아니라
  `homepage.socialLinks` 에 반영하고 헤더 버튼만 다시 매핑한다.

---

## common/footer.html

| data-\* 속성                  | 요소                        | JSON 경로                                  |
| ----------------------------- | --------------------------- | ------------------------------------------ |
| `data-footer-phone`           | `.ft_tel` 전화번호 `<span>` | `property.contactPhone[0]`                 |
| `data-footer-phone-link`      | `.ft_tel` `<a>` (tel: 링크) | `tel:{contactPhone[0] 숫자만}`             |
| `data-footer-business-name`   | 상호 `<span>`               | `property.businessInfo.businessName`       |
| `data-footer-address`         | 도로명 `<span>`             | `property.businessInfo.businessAddress`    |
| `data-footer-business-number` | 사업자번호 `<span>`         | `property.businessInfo.businessNumber`     |
| `data-footer-representative`  | 대표자 `<span>`             | `property.businessInfo.representativeName` |

- `.ft_link`(ABOUT/ROOMS/SPECIAL/RESERVE), 개인정보처리방침은 **정적 유지**(트립일레븐 공통). copyright 는 `property.tripProviderName` 으로 치환한다(아래 「카피라이트」).

---

## SEO / 메타 (전 페이지 공통)

`js/preview-handler.js`의 `applySeo()`가 모든 페이지에서 `homepage.seo`를 head에 주입(standalone + 백오피스 preview). meta 태그는 JS가 동적 생성/갱신하므로 각 HTML은 `<title data-page-title>` + `<meta property="og:type" content="website">`만 둔다. **하드코딩 SEO 메타(og:title/description, keywords, og:image, og:url, google/naver-site-verification)는 제거**(applySeo가 JSON으로 생성).

| 대상                                         | JSON 경로                  |
| -------------------------------------------- | -------------------------- |
| `<title data-page-title>` + `document.title` | `homepage.seo.title`       |
| `<meta name="description">`                  | `homepage.seo.description` |
| `<meta name="keywords">`                     | `homepage.seo.keywords`    |
| `<meta property="og:title">`                 | `homepage.seo.title`       |
| `<meta property="og:description">`           | `homepage.seo.description` |

---

## 테마 색상/폰트

`styles/theme.css` 기준(보류). 별도 지시 시 작업.

---

## index.html

> F index 구성: 비주얼(hero) → main_about(essence) → main_special(facilities) → main_room(roomtypes) → main_reserve(closing). 예약 버튼은 공통 `data-booking-link`.

| data-\* 속성                     | 요소                                      | JSON 경로                                                                                                                                                              |
| -------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data-index-hero-slides`         | `.main_visual .mvisual .swiper-wrapper`   | `customFields.pages.index.sections[0].hero.images[isSelected]` (배경 슬라이드)                                                                                         |
| `data-index-about-title`         | `.main_about .fr p.btxt`                  | `essence.title` (없으면 `A quiet moment,<br> surrounded by nature` fallback)                                                                                           |
| `data-index-about-image`         | `.main_about .fl .img` (배경)             | `essence.images[isSelected][0].url` (없으면 empty placeholder)                                                                                                         |
| `data-index-about-description`   | `.main_about .fr p.stxt`(첫 번째)         | `essence.description` (없으면 `창밖으로 이어지는 자연의 풍경 속에서 일상의 흐름을 잠시 내려놓고 {property.name}에서 조용히 머무는 시간의 여유를 느껴보세요.` fallback) |
| `data-index-special-slides`      | `.main_special .spec-img .swiper-wrapper` | `property.facilities[]` (이미지 슬라이드)                                                                                                                              |
| `data-index-special-titles`      | `.main_special .spec-tit`                 | `property.facilities[]` (각 `.txt-con` stxt=`name`)                                                                                                                    |
| `data-index-special-texts`       | `.main_special .spec-txt .swiper-wrapper` | `property.facilities[]` (각 슬라이드 stxt=`description`)                                                                                                               |
| `data-index-room-slides`         | `.main_room .preivew .swiper-wrapper`     | `customFields.roomtypes[]` (+ `rooms[]` id매칭 구조)                                                                                                                   |
| `data-index-closing-description` | `.main_reserve .cont p`(텍스트)           | `customFields.pages.index.sections[0].closing.description`                                                                                                             |
| `data-booking-link`              | `.main_reserve .cont a` 예약하기          | `property.realtimeBookingId`                                                                                                                                           |

> 영문 글귀(`.main_about p.btxt`, `.spec-tit`/`.spec-txt`의 `special`·`SPECIAL 0N`)는 디자인 장식이라 **정적 유지**.

### data-index-hero-slides 슬라이드 구조

```
hero.images[isSelected] 기준:
<div class="swiper-slide"><div class="img" style="background:url({url}) no-repeat 50%;background-size:cover;"></div></div>
이미지 없으면 No-Image placeholder 1개
```

### data-index-special-\* 동적 구조 (facilities[] 순회, 3개 컨테이너 동기)

```
spec-img  : <div class="swiper-slide item"><a href="facility.html?id={id}"><div class="img" style="background-image:url({images[isSelected][0].url})"></div></a></div>
spec-tit  : <div class="txt-con(첫번째 on)"><p class="btxt">special</p><p class="stxt">{name}</p></div>
spec-txt  : <div class="swiper-slide item"><div class="txt"><p class="btxt">SPECIAL 0{i+1}</p><p class="stxt">{name}</p></div></div>
이름 없는 facility는 skip
```

### data-index-room-slides 슬라이드 구조 (roomtypes[] 순회)

```
- 이미지: roomtypes[i] thumbnail(category=roomtype_thumbnail, isSelected) 첫 번째
- btxt:   roomtypes[i].name
- stxt:   rooms[j].roomStructures[0] + "/ " + totalRoomCount 값≥1 항목 한글 나열 (roomtypes[i].id === rooms[j].id 매칭)
- 링크:   room.html?room_id={roomtypes[i].id}
이름 없는 roomtype은 skip
```

---

## main.html

> F main(=ABOUT/소개) 구성: 서브비주얼(hero 슬라이더) → snb 서브탭 → main_about(텍스트=hero, 이미지=about[0]) → about_wrap(about[0] 이미지 갤러리) → main_reserve(index.closing 공용).

| data-\* 속성                    | 요소                                   | JSON 경로                                                                                                                                                                                  |
| ------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data-main-hero-slides`         | `.sub_visual .svisual .swiper-wrapper` | `customFields.pages.main.sections[0].hero.images[isSelected]` (배경 슬라이드)                                                                                                              |
| `data-main-about-title`         | `.main_about .fr p.btxt`               | `pages.main.sections[0].hero.title` (없으면 `A quiet moment,<br> surrounded by nature` fallback)                                                                                           |
| `data-main-about-description`   | `.main_about .fr p.stxt`               | `pages.main.sections[0].hero.description` (없으면 `창밖으로 이어지는 자연의 풍경 속에서 일상의 흐름을 잠시 내려놓고 {property.name}에서 조용히 머무는 시간의 여유를 느껴보세요.` fallback) |
| `data-main-about-image`         | `.main_about .fl .img` (배경)          | `pages.main.sections[0].about[0].images[isSelected][0].url` (없으면 empty placeholder)                                                                                                     |
| `data-main-about-images`        | `.about_wrap .list ul`                 | `pages.main.sections[0].about[0].images[isSelected]` (고정 5칸 그리드, 부족분 empty placeholder)                                                                                           |
| `data-main-closing-description` | `.main_reserve .cont p`                | `pages.index.sections[0].closing.description` (공용)                                                                                                                                       |
| `data-booking-link`             | `.main_reserve .cont a` 예약하기       | `property.realtimeBookingId`                                                                                                                                                               |

- `#snb_wrap`(외부풍경/오시는길)은 정적 유지(href만 수정: 외부풍경→`/main.html`, 오시는길→`/directions.html`).
- main_about 텍스트는 hero, 이미지(좌측+갤러리)는 about[0] 사용. about[1]은 main에서 미사용.
- main_reserve는 main 전용 closing이 없어 index.closing을 공용으로 사용.

### data-main-hero-slides 슬라이드 구조

```
hero.images[isSelected] 기준:
<div class="swiper-slide"><div class="img" style="background:url({url}) no-repeat 50%;background-size:cover;"></div></div>
이미지 없으면 No-Image placeholder 슬라이드 1개
```

### data-main-about-images li 구조 (about[0].images[isSelected] 순회)

```
<li>
  <p class="fadeUp" data-scroll style="background:url({url});background-position:50% 50%"></p>
  <img src="{url}" alt="">
</li>
```

---

## directions.html

> F directions(=오시는길) 구성: 서브비주얼(hero 슬라이더) → snb 서브탭 → 안내문구 → 지도(Kakao) + 이용안내/주소/전화.

| data-\* 속성                         | 요소                                   | JSON 경로                                                                                                         |
| ------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `data-directions-hero-slides`        | `.sub_visual .svisual .swiper-wrapper` | `customFields.pages.directions.sections[0].hero.images[isSelected]` (배경 슬라이드)                               |
| `data-directions-title`              | `.reser-wrap .sub_txt`                 | `pages.directions.sections[0].hero.title` (없으면 `{property.name}에 찾아 오시는 길을 안내해 드립니다.` fallback) |
| `#kakao-map`                         | `.map > #kakao-map`                    | `property.latitude` / `property.longitude` (kakao-maps-sdk 지도+마커, trip-c/d 방식)                              |
| `data-directions-notice-title`       | `.map_info dl dt`(이용안내)            | `pages.directions.sections[0].notice.title`                                                                       |
| `data-directions-notice-description` | `.map_info dl dd`(이용안내)            | `pages.directions.sections[0].notice.description` (\n→`<br>`)                                                     |
| `data-property-address`              | `.map_info dl dd`(주소)                | `property.address`                                                                                                |
| `data-property-phone`                | `.map_info dl dd`(전화) `<span>`       | `property.contactPhone[0]`                                                                                        |
| `data-property-phone-link`           | `.map_info dl dd`(전화) `<a>`          | `tel:{contactPhone[0] 숫자만}`                                                                                    |

- `#snb_wrap`(외부풍경/오시는길)은 정적 유지(외부풍경→`/main.html`, 오시는길→`/directions.html`).
- 지도: F의 Daum roughmap(키 기반) 위젯 제거 → `<div id="kakao-map">` + `js/kakao-maps-sdk.js`(body 끝)로 교체.

### 헤더 메뉴 구조 (common/header.html 3곳: PC lnb / 모바일 aside / 전체메뉴 동일)

- ABOUT: 펜션소개(`/main.html`) · 오시는길(`/directions.html`)
- ROOMS: 미리보기(`/layout-map.html`, `data-menu-id="layout-map"` → `layoutMap.enabled` 토글) + roomtypes(동적)
- SPECIAL: facilities(동적) / RESERVE: 예약하기(booking) · 이용안내(`/reservation.html`)

---

## layout-map.html (= ROOMS 미리보기)

> live `eunjeongwon.kr/room.html`과 동일 구조의 객실 미리보기/목록 페이지. ROOMS "미리보기" 링크 대상이며 `layoutMap.enabled`로 헤더 노출이 토글된다.

| data-\* 속성                  | 요소                                   | JSON 경로                                                                                  |
| ----------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `data-layout-map-hero-slides` | `.sub_visual .svisual .swiper-wrapper` | `customFields.pages.layoutMap.sections[0].hero.images[isSelected]` (배경 슬라이드)         |
| `data-room-list-nav`          | `#snb_wrap ul`                         | `customFields.roomtypes[]` (룸 미리보기 li 뒤 동적 생성, `room.html?room_id={id}`)         |
| `data-layout-map-image`       | `.wide_img img`                        | `pages.layoutMap.sections[0].about.images[isSelected][0].url` (배치도, 없으면 placeholder) |
| `data-room-list-slides`       | `.main_room .preivew .swiper-wrapper`  | `customFields.roomtypes[]` (+ `rooms[]` id매칭 구조)                                       |

### data-room-list-slides 슬라이드 구조 (roomtypes[] 순회)

```
- 이미지: roomtype_thumbnail(isSelected) 첫 번째 (background)
- btxt:   roomtypes[i].name
- stxt:   rooms[j].roomStructures[0] + "/ " + totalRoomCount 값≥1 항목 한글 나열 (id 매칭)
- 링크:   room.html?room_id={roomtypes[i].id} (.custom_mousemove)
```

---

## room.html (객실 상세)

> URL `?room_id={roomtype.id}`로 현재 객실타입(current) 결정. 이미지/이름은 `customFields.roomtypes[current]`, 인원·평형·구조·집기는 `rooms[]`(roomtypes[current].id === rooms[j].id 매칭)에서 가져온다. current 없으면 첫 roomtype.

| data-\* 속성               | 요소                                       | JSON 경로                                                                                            |
| -------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `data-room-hero-slides`    | `.sub_visual .svisual .swiper-wrapper`     | `roomtypes[current]` interior 이미지[isSelected] (배경 슬라이드)                                     |
| `data-room-list-nav`       | `#snb_wrap ul`                             | `roomtypes[]` (미리보기 li 뒤 동적 생성, 현재 객실 `active`/`on`)                                    |
| `data-room-name`           | info `.btxt` + 표 객실명(PC/모바일)        | `roomtypes[current].name`                                                                            |
| `data-room-structure`      | info `.stxt` + 표 유형(PC/모바일)          | `rooms[j].roomStructures[0] + "/ " + totalRoomCount 값≥1 한글` (id 매칭)                             |
| `data-room-image-main`     | info `.fl .img p` (배경)                   | `roomtypes[current]` interior[0]                                                                     |
| `data-room-thumbs`         | info `.fr ul` (li 배경, 2칸)               | `roomtypes[current]` interior 순서대로                                                               |
| `data-room-thumbs-m`       | info `.mobile ul` (li>img, 2칸)            | `roomtypes[current]` interior 순서대로                                                               |
| `data-room-intro`          | `.inst h3`                                 | `rooms[j].roomInfo` (영문 `.stit`은 정적)                                                            |
| `data-room-base-occupancy` | 표 기준(PC/모바일)                         | `rooms[j].baseOccupancy`                                                                             |
| `data-room-max-occupancy`  | 표 최대(PC/모바일)                         | `rooms[j].maxOccupancy`                                                                              |
| `data-room-size`           | 표 평형(PC)                                | `rooms[j].size + "평"`                                                                               |
| `data-room-amenities`      | `.table_text` 집기품목(PC/모바일)          | `rooms[j].amenities.join(', ')`                                                                      |
| `data-room-gallery`        | `.list` (li p배경+img 순서 주입, 5칸 고정) | `roomtypes[current]` 컨셉 및 외경(`roomtype_exterior`, isSelected) 순서대로 (scaleAni 레이아웃 유지) |
| `data-room-list-slides`    | `.main_room .preivew .swiper-wrapper`      | `roomtypes[]` (+rooms id매칭 구조, 미리보기 슬라이더)                                                |
| `data-booking-link`        | info 예약하기 `<a>`                        | `property.realtimeBookingId` (header-footer-mapper 공통 처리)                                        |
| `data-room-floorplan-section` | `.room_floorplan` (제목 없음, 이미지 한 장) | 평면도 이미지가 없으면 **섹션 전체 미노출** |
| `data-room-floorplan-image` | `.room_floorplan img` | 원본 객실 상세의 평면도 영역에서 크롤링된 이미지 |

- 이미지 영역은 각 영역이 지정한 category(hero/info=interior, 갤러리=exterior, 미리보기=thumbnail)에서 `isSelected` 이미지를 순서대로 채우며, 없으면 `ImageHelpers` empty placeholder.

---


### 객실 평면도

평면도는 일반 객실 이미지로 대체하지 않는다. 크롤러가 원본 객실 상세의 **평면도 HTML 영역**을 따로 탐지해 아래 중 하나로 저장했을 때만 노출한다.

| 지원 데이터 형태                                                                           | 비고            |
| ------------------------------------------------------------------------------------------ | --------------- |
| `roomtypes[current].floorplanImages[]`                                                     | 권장            |
| `roomtypes[current].floorplans[]`                                                          | 호환            |
| `roomtypes[current].floorplan.images[]`                                                    | 호환            |
| `roomtypes[current].images[].category = "roomtype_floorplan"`                              | 카테고리형 호환 |
| `roomtypes[current].images[].category = "floorplan"` / `"room_floorplan"` / `"floor_plan"` | 카테고리형 호환 |

⚠️ **제목·설명 자리가 없다.** 도면 이미지 한 장이 전부다.
⚠️ **데이터가 없으면 `[data-room-floorplan-section]` 을 `display:none` 한다.** 마크업의 기본값도 `style="display:none"` 이라 매핑 전에도 빈 구간이 보이지 않는다. URL 이 있는데 로드가 실패해도 구간째 숨긴다.
⚠️ `roomtype_interior` / `roomtype_thumbnail` / `roomtype_exterior` 는 평면도 폴백으로 쓰지 않는다.
⚠️ `layout-map` 의 **배치도**는 반대로 이미지가 없어도 placeholder 를 세운다 — 숙소에 하나뿐인 자리라 업주가 넣을 곳을 알아야 하기 때문이다. 규칙이 정반대이니 헷갈리지 말 것.

⚠️ **백오피스가 아직 안 내려준다.** `groupName` 과 마찬가지로 앞으로 내려줄 예정이라 미리 대응해 둔 것이다. 시드에도 넣지 않는다.

## facility.html (SPECIAL 시설)

> URL `?id={facility.id}`로 현재 시설(current) 결정. `property.facilities[current]` 기준. 하단 main_special은 index와 동일하게 전체 facilities[] 슬라이더.

| data-\* 속성                | 요소                                      | JSON 경로                                                                                                                |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `data-facility-hero-slides` | `.sub_visual .svisual .swiper-wrapper`    | `facilities[current].images[isSelected]` (배경 슬라이드)                                                                 |
| `data-facility-nav`         | `#snb_wrap ul`                            | `facilities[]` (동적 생성, 현재 active, `facility.html?id={id}`)                                                         |
| `data-facility-name`        | `.special_wrap .info .txt .stxt`          | `facilities[current].name` (영문 `.btxt`='SPECIAL' 정적)                                                                 |
| `data-facility-description` | `.special_wrap .info .ctxt p`             | `pages.facility[current.id].sections[0].about.title` 우선, 없으면 `facilities[current].description` fallback (\n→`<br>`) |
| `data-facility-image`       | `.special_wrap .info .img p` (배경)       | `facilities[current].images[isSelected][0].url` (없으면 placeholder)                                                     |
| `data-facility-gallery`     | `.special_wrap .list`                     | `facilities[current].images[isSelected]` (각 li p배경 순서대로)                                                          |
| `data-index-special-slides` | `.main_special .spec-img .swiper-wrapper` | `property.facilities[]` (이미지 슬라이더, index와 동일)                                                                  |
| `data-index-special-titles` | `.main_special .spec-tit`                 | `facilities[]` (stxt=name)                                                                                               |
| `data-index-special-texts`  | `.main_special .spec-txt .swiper-wrapper` | `facilities[]` (stxt=description)                                                                                        |
| `data-closing-description`  | `.main_reserve .cont p`                   | `pages.index.sections[0].closing.description` (공용)                                                                     |
| `data-booking-link`         | `.main_reserve` 예약하기 `<a>`            | `property.realtimeBookingId`                                                                                             |

- 이미지 없으면 전 영역 `ImageHelpers` empty placeholder. main_reserve 배경은 디자인 기본(real_bg) 유지.

## reservation.html (이용안내)

> 이용안내/환불안내 본문. 콘텐츠는 `property`의 표준 정책 필드에서 가져온다(이미지·property-name은 디자인에 없어 미사용).

| data-\* 속성                         | 요소                                   | JSON 경로                                                                                              |
| ------------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `data-reservation-hero-slides`       | `.sub_visual .svisual .swiper-wrapper` | `pages.reservation.sections[0].hero.images[isSelected]` (배경 슬라이드)                                |
| `data-reservation-title`             | `.sub_title .sub_txt`                  | `pages.reservation.sections[0].hero.title` (없으면 `예약시 참고하실 내용을 안내해 드립니다.` fallback) |
| `data-booking-link`                  | `#snb_wrap` 예약하기 `<a>`             | `property.realtimeBookingId` (header-footer-mapper 공통 처리)                                          |
| `data-reservation-checkin-info`      | 이용안내 dd `<p>` (입퇴실)             | `[입퇴실안내]` 라벨 + `property.checkin`/`checkout`/`checkInOutInfo`                                   |
| `data-reservation-usage-guide`       | 이용안내 dd `<p>` (이용)               | `property.usageGuide` (\n→`<br>`)                                                                      |
| `data-reservation-reservation-guide` | 이용안내 dd `<p>` (예약)               | `property.reservationGuide` (\n→`<br>`)                                                                |
| `data-reservation-refund-policies`   | 환불안내 dd                            | `property.refundPolicies[]` (동적: `* 이용일 N일 이전 취소시 R% 환불`)                                 |

- snb 이용안내 항목은 현재 페이지라 정적 active. 환불 당일(`refundProcessingDays===0`)은 `* 당일 취소시 R% 환불`.

## nearby-attractions.html (주변여행지)

> main.html의 hero(`sub_visual svisual`) + about(`main_about`) 시각 언어 재사용. about은 **블록 배열**이라 블록마다 한 행을 동적 생성한다. 섹션 `enabled=false`면 `404.html`로 리다이렉트(표준 동작).

| data-\* 속성                      | 요소                                   | JSON 경로                                                                          |
| --------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| `data-nearby-hero-slides`         | `.sub_visual .svisual .swiper-wrapper` | `pages.nearbyAttractions.sections[0].hero.images[isSelected]` (배경 슬라이드)      |
| `data-nearby-about-blocks`        | `#content` 블록 컨테이너               | `pages.nearbyAttractions.sections[0].about[]` (블록마다 `.main_about` 생성)        |
| `data-nearby-closing-description` | 푸터 위 `.main_reserve .cont p`        | `pages.index.sections[0].closing.description` (index/main 공용, 배경 real_bg 정적) |
| `data-booking-link`               | 클로징 예약하기 `<a>`                  | `property.realtimeBookingId` (header-footer-mapper 공통 처리)                      |

- 각 about 블록(`.main_about > .cont > .fl/.fr`) 매핑:
  - `.fl .img` (배경) ← `block.images[isSelected][0].url` (없으면 empty placeholder) — **이미지**
  - `.fr .txt .btxt` ← `block.title` — **타이틀**
  - `.fr .txt .stxt.mg60t` ← `block.description` (\n→`<br>`, 없으면 생략) — **설명**
  - `.fr .txt .stxt.cap.mg40t` ← `block.images[isSelected][0].description` (없으면 생략) — **이미지설명**
- 레이아웃은 전 블록 동일(이미지 좌/텍스트 우). 좌우 교차가 필요하면 별도 CSS 추가 필요.
- **메뉴 노출/404**: 헤더 ABOUT > 주변관광지(`data-travel-menu`)는 `nearbyAttractions.enabled=false`면 숨김. 매퍼는 `sections[0]` 없음 또는 `enabled=false`면 **무조건** `404.html`로 리다이렉트(c/l/e 동일, preview 포함). `layout-map`도 동일 방식(`layoutMap.enabled`).

## 팝업 (popup)

> c/l/e 공통 컴포넌트 이식. `styles/popup.css` + `js/popup.js`(PopupManager). **index.html에만** 적용(`<div id="popup-container">` + `<script src="js/popup.js">` + popup.css link).

- 데이터: `homepage.customFields.popup.popups[]` (각 항목 `enabled`/`startDate`/`endDate`/`sortOrder`/`images[isSelected]`/`link`/`title`/`description`).
- 노출 조건: `enabled=true` + 표시기간 내 + (standalone) 오늘 숨김 아님 + 선택 이미지 1장 이상. 선택 이미지마다 박스 1개를 동시에 표시.
- standalone: `popup.js`가 `./standard-template-data.json` fetch. 백오피스 preview: `window.parent !== window`로 감지 + `preview-handler`가 `POPUP_UPDATE` 메시지를 `popupManager.updateFromPreview()`로 전달(실시간).
- 박스별 닫기 / "오늘 하루 보지 않기"(localStorage) / 배경·ESC 닫기. 스타일은 c/l/e 동일.

## 404.html

> layout-map / nearby-attractions가 `enabled=false`일 때 리다이렉트 대상. D 스타일로 재구현(reset+theme+style, 헤더/푸터 동적, `var(--color-secondary)`/`var(--font-*)`). 기존 D 잔재(common.css/sub.css/jQuery) 의존 제거.

## 정리(미사용 제거)

- CSS: `vendor/aos.css`, `common.css`, `sub.css` 삭제
- JS: `aos.js`, `sly.js`, `jquery.min.js`, `jquery-ui.min.js`, `jquery.cookie.min.js`, `room-list-mapper.js` 삭제
- HTML: `room-list.html` 삭제(+ preview-handler 매핑 정리)
- 이미지: 콘텐츠 사진(`1~3*.webp`), `b_logo.png`, `real_clocko.png`, `price.png`, `mbt_reserve01/o01.png`, `talk.png`, 깨진 폰트(`JejuMyeongjo.*`, `abigail.woff2`) 삭제

---

## 객실 그룹 규칙 (`groupName`)

`roomtypes[].groupName`이 **하나라도 있으면** 그룹 모드로
동작한다. 없으면 객실 하나가 항목 하나다. 규칙은 `base-mapper.js` 한 곳에 있다.

**그룹으로 접히는 곳은 헤더 ROOMS 메뉴와 객실 상세 탭뿐이다.**
Room Preview(미리보기) 카드는 그룹과 무관하게 **항상 전체 객실**을 깔고,
카드마다 자기 객실 상세로 연결한다 — 원본이 그렇다.

| 함수                     | 역할                                                                      |
| ------------------------ | ------------------------------------------------------------------------- |
| `hasRoomGroups()`        | `groupName` 이 하나라도 있는지                                            |
| `getRoomMenuItems()`     | 그룹 단위 항목 배열 — `{ label, groupName, roomtype(대표), roomtypes[] }` |
| `getRoomMenuLabel()`     | 메뉴에 쓸 이름 — **그룹명** (없으면 객실명)                               |
| `getRoomMenuLink()`      | **그룹의 첫 객실** 상세로 연결                                            |
| `isRoomMenuItemActive()` | 그룹 안 **어느 객실 id 로 들어와도** 그 항목을 활성으로 본다              |
| `mapRoomSlides()`        | 미리보기 카드 — **그룹을 쓰지 않고 `roomtypes[]` 전체**를 깐다            |

### 화면 흐름

```
헤더 ROOMS 메뉴        →  그룹명        (스파동 | 프리미엄동)
        ↓ 그룹명 클릭
그룹의 첫 번째 객실 상세 →  탭에 그 그룹의 모든 객실
                            (미리보기 | 에버골드 | 퍼블하제 | 유메)

Room Preview(미리보기)  →  전체 객실 (그룹과 무관), 카드마다 자기 객실 상세로 연결
```

### ⚠️ 객실 상세 탭은 그룹을 펼친다

헤더는 그룹명 하나로 접히므로, **상세 페이지 탭까지 접으면 그룹의 첫 객실
외에는 헤더에서 도달할 방법이 없다.** 그래서 탭은 현재 객실이 속한 그룹을 찾아
**그 그룹의 객실만** 렌더한다. (미리보기에서는 어느 객실이든 바로 갈 수 있다)

| 상황                             | 탭                                                                                 |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| 그룹 밖 (미리보기 / 미그룹 객실) | `미리보기 \| 스파동 \| 프리미엄동 \| …`                                            |
| 그룹 안 (멤버 2실 이상)          | `미리보기 \| 에버골드 \| 퍼블하제 \| 유메`                                         |
| 멤버 1실 그룹                    | 펼치지 않음 — 항목이 하나뿐이라 탭이 비다시피 하고 그룹명 = 객실명이라 의미가 없다 |
| `groupName` 없음                 | 기존과 동일 (객실 하나가 항목 하나)                                                |

**다른 그룹은 이 줄에 섞지 않는다.** 그룹명과 객실명이 나란히 놓이면 부모/자식이
형제처럼 보인다. 다른 그룹으로는 헤더 ROOMS 메뉴나 미리보기를 거쳐 이동한다.

탭을 다시 그릴 때 **첫 li(`미리보기`)는 남기고** `data-generated="room"` 이 붙은
이전 생성분만 지운다. 통째로 비우면 미리보기로 돌아갈 길이 없어진다.

---

## 카피라이트 (`data-copyright`)

푸터 카피라이트는 `property.tripProviderName`(Trip11 공급자명)으로 렌더한다.

`common/footer.html` 의 카피라이트 요소에 템플릿 문자열을 두고,
`header-footer-mapper.js` 의 `mapCopyright()` 가 `{provider}` 를 치환한다.

```html
<a href="http://trip11.kr/" data-copyright="COPYRIGHT©{provider}. ALL RIGHTS RESERVED.">
  COPYRIGHT©(주)트립일레븐. ALL RIGHTS RESERVED.
</a>
```

| `property.tripProviderName` | 결과                                  |
| --------------------------- | ------------------------------------- |
| `"신비서"`                  | `COPYRIGHT©신비서. ALL RIGHTS RESERVED.` |
| `""` / 미입력               | HTML 에 적힌 기존 문구 그대로          |

- 문구 형식(대소문자, `ⓒ` 접두, `(주)` 표기)은 템플릿마다 달라서 **형식은 `data-copyright` 속성값이 갖고
  매퍼는 이름만 바꾼다**.
- 값이 없을 때(백오피스 미입력 → `""`) 는 건드리지 않으므로 기존 트립일레븐 문구가 그대로 남는다.
- `trip11.kr` 링크는 변경하지 않는다.

---

## landing.html (선택 기능 — 여러 숙소 게이트)

t-template-A 와 같은 구현이다 (상세 스키마·카드 구조는 `t-template-A/data-mapping.md` 의 landing 절).
헤더/푸터가 없는 별도 페이지이고, 카드(`pages.landing.sections[0].about[]`, 1~3장)를 그리드로 나란히 놓는다.

**루트 가드** — `IndexMapper.mapPage()` → `maybeRedirectToLanding()` → `shouldEnterLanding()`

- 어드민 프리뷰 iframe 안이면 skip
- `pages.landing.sections[0].enabled !== true` 면 skip — **명시적으로 켠 숙소만** 가로챈다.
  섹션이 없거나 `enabled` 가 false/누락이면 기존처럼 `index.html` 을 그대로 보여준다
- `document.referrer` 가 같은 origin 이면 skip (헤더 로고, 랜딩의 자기 자신 카드)
- `document.referrer` 호스트가 `about[].domain` 중 하나면 skip (연결 숙소 랜딩에서 카드로 넘어옴)
- 그 외 (주소 직접 입력·즐겨찾기·검색/외부 링크) → `location.replace('landing.html')`

`landing.html` 을 직접 열었는데 `enabled !== true` 면 `404.html` 로 보낸다.

쿼리 파라미터 없이 **referrer** 로 "랜딩을 이미 거쳤는지" 를 가른다. 그래서 헤더 로고 링크는 원래대로
`index.html`, 랜딩 카드도 `./index.html` / `{domain}/` 로 보낸다.

- 크로스 도메인 referrer 는 브라우저 기본 정책(`strict-origin-when-cross-origin`)상 origin 만 오므로 호스트로만 비교한다 (`www.` 유무 무시).
- 연결 숙소 B 의 랜딩 `about[]` 에 A 의 도메인이 없으면, A 랜딩 → B 카드 클릭 시 B 의 랜딩이 한 번 더 뜬다.
- https → http 로 넘어가면 브라우저가 referrer 를 보내지 않아 랜딩이 다시 뜬다 (연결 숙소 도메인은 https 전제).

**카드 링크** (`landing-mapper.js` `getCardLink()`) — 전부 새 탭. 도착한 index 는 referrer 로 랜딩을 건너뛴다

| 조건                                         | 이동                          |
| -------------------------------------------- | ----------------------------- |
| `about[i].propertyId === property.id`        | `./index.html`                |
| 연결 숙소 + `about[i].domain` 있음           | `{domain}/`                   |
| 연결 숙소인데 `domain` 없음                  | `href="#"` (비활성)           |

카드 배경은 `about[i].images` 첫 장, 로고는 `hero.images[]` 중 `blockId === about[i].blockId`,
로고가 없으면 `about[i].propertyName` 텍스트, `about[i].title` 은 입력했을 때만 보인다.

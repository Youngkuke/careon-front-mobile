# 모바일 API 명세

## 공통 규칙

- Base URL은 환경별로 다르며, 문서에는 API path만 표기합니다.
- 인증이 필요한 API는 `Authorization: Bearer {accessToken}` 헤더를 사용합니다.
- 앱 로그인은 `accessToken`과 `refreshToken`을 함께 발급합니다.
- `accessToken` 유효 시간은 1시간, `refreshToken` 유효 시간은 90일입니다.
- 앱 회원가입은 제공하지 않습니다. 웹에서 가입한 계정으로 로그인합니다.
- 빈 목록은 에러가 아니라 `200 OK`와 빈 배열 `[]`로 응답합니다.
- 날짜는 별도 표기가 없으면 `YYYY-MM-DD`, 일시는 ISO-8601 형식입니다.

### 공통 에러 응답

```json
{
  "timestamp": "2026-07-03T15:49:07.014+09:00",
  "status": 400,
  "error": "Bad Request",
  "message": "에러 메시지",
  "path": "/api/app/..."
}
```

## 엔드포인트 요약

| 분류 | 이름 | Method | Path | 인증 | 상태 |
| --- | --- | --- | --- | --- | --- |
| 유저 관리 | 로그인 | POST | `/api/app/users/login` | 불필요 | 검토 완료 |
| 유저 관리 | 로그아웃 | POST | `/api/app/users/logout` | 필요 | 검토 완료 |
| 유저 관리 | 액세스 토큰 재발급 | POST | `/api/app/users/refresh` | 불필요 | 검토 완료 |
| 유저 관리 | 내 정보 조회 | GET | `/api/app/users/me` | 필요 | 검토 완료 |
| 유저 관리 | 회원정보 수정 | PATCH | `/api/app/users/me` | 필요 | 검토 완료 |
| 유저 관리 | 회원 탈퇴 | DELETE | `/api/app/users/me` | 필요 | 검토 완료 |
| 앱 제도 관리 | 저장한 제도 목록 조회 | GET | `/api/app/users/me/saved-policies` | 필요 | 검토 완료 |
| 앱 제도 관리 | 알림 목록 조회 | GET | `/api/app/users/me/notifications` | 필요 | 검토 완료 |
| 앱 투두 관리 | 투두 목록 조회 | GET | `/api/app/users/me/todos` | 필요 | 검토 완료 |
| 앱 투두 관리 | 투두 체크/체크 해제 | PATCH | `/api/app/users/me/todos/{todoId}` | 필요 | 검토 완료 |

## 유저 관리

### 로그인

이메일과 비밀번호로 로그인합니다. 성공 시 앱 자동 로그인 유지를 위한 `accessToken`과 `refreshToken`을 함께 반환합니다.

**Request**

`POST /api/app/users/login`

```json
{
  "email": "pjs123@gmail.com",
  "password": "abcd1234!"
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| email | String | Y | 로그인용 이메일 |
| password | String | Y | 로그인용 비밀번호 |

**Response `200 OK`**

```json
{
  "userId": 1,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 400 | `이메일과 비밀번호를 입력해주세요.` | 이메일 또는 비밀번호 누락 |
| 401 | `이메일 또는 비밀번호가 일치하지 않습니다.` | 이메일 없음 또는 비밀번호 불일치 |

### 로그아웃

로그인한 유저를 로그아웃 처리합니다. 앱에서 로그인 시 서버에 저장한 `refreshToken`을 무효화합니다.

**Request**

`POST /api/app/users/logout`

Request Body 없음.

**Response `200 OK`**

```json
{
  "message": "로그아웃되었습니다."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

### 액세스 토큰 재발급

`accessToken`이 만료되었을 때 `refreshToken`으로 새 토큰을 발급받습니다.

- 재발급 시 `refreshToken`도 새 값으로 교체됩니다.
- 기존 `refreshToken`은 이후 사용할 수 없습니다.
- 새 `refreshToken`의 만료일은 재발급 시점부터 다시 90일입니다.

**Request**

`POST /api/app/users/refresh`

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| refreshToken | String | Y | 로그인 또는 이전 재발급 시 발급받은 refreshToken |

**Response `200 OK`**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `재로그인이 필요합니다.` | refreshToken 누락, 만료, 무효, 서버 저장값과 불일치 |

### 내 정보 조회

마이페이지에 표시할 로그인 유저 정보를 조회합니다.

**Request**

`GET /api/app/users/me`

Request Body 없음.

**Response `200 OK`**

```json
{
  "userId": 1,
  "name": "영크케",
  "email": "pjs123@gmail.com",
  "region": "동작구",
  "notificationEnabled": true
}
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| userId | Integer | 유저 ID |
| name | String | 이름 또는 닉네임 |
| email | String | 이메일 |
| region | String | 거주 지역(서울시 구) |
| notificationEnabled | Boolean | 알림 수신 여부 |

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

### 회원정보 수정

로그인한 유저 본인의 정보를 수정합니다. 모든 필드는 optional이며, 앱은 화면마다 필요한 필드 하나만 보내도 됩니다.

- 비밀번호 확인 값은 프론트에서만 검증하고 서버에는 최종 `password` 값만 전송합니다.

**Request**

`PATCH /api/app/users/me`

```json
{
  "name": "영크케"
}
```

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| name | String | N | 이름 또는 닉네임. 최대 50자 |
| email | String | N | 이메일. 최대 255자, 본인 제외 중복 불가 |
| password | String | N | 새 비밀번호. 8~20자, 영문+숫자 포함 |
| region | String | N | 거주 지역(서울시 구). 최대 20자 |
| notificationEnabled | Boolean | N | 알림 수신 여부 |

**Response `200 OK`**

```json
{
  "message": "회원 정보가 수정되었습니다."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 400 | `이메일 형식이 올바르지 않습니다.` | 이메일 형식 오류 |
| 400 | `비밀번호는 영문과 숫자를 포함하여 8~20자여야 합니다.` | 비밀번호 형식 오류 |
| 401 | `로그인이 필요합니다.` | 인증 실패 |
| 409 | `이미 사용 중인 이메일입니다.` | 이메일 중복 |

### 회원 탈퇴

로그인한 유저의 계정을 삭제합니다. 저장 제도, 투두, 알림, 관심 유형 연결 데이터도 함께 정리됩니다.

**Request**

`DELETE /api/app/users/me`

Request Body 없음.

**Response `200 OK`**

```json
{
  "message": "회원 탈퇴가 완료되었습니다."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

## 앱 제도 관리

### 저장한 제도 목록 조회

로그인한 유저가 웹에서 저장한 제도 목록을 앱 캘린더 화면용으로 조회합니다.

- 캘린더 마커와 하단 카드 리스트에 사용합니다.
- 월 이동은 프론트에서 전체 데이터를 받아 필터링하므로 `year`, `month` 파라미터는 없습니다.
- 날짜가 지난 항목도 제외하지 않습니다.
- 정렬 기준은 D- 항목을 먼저 임박한 순으로 정렬하고, 이후 D+ 항목을 최근 지난 순으로 이어붙입니다.

**Request**

`GET /api/app/users/me/saved-policies`

Request Body 없음.

**Response `200 OK`**

```json
[
  {
    "name": "가족돌봄청년 일상 돌봄",
    "deadline": "2026-07-20",
    "deadlineDDay": "D-7",
    "documents": ["가족관계증명서", "진단서"],
    "resultDate": null,
    "resultDDay": null
  },
  {
    "name": "청년 마음건강 바우처",
    "deadline": null,
    "deadlineDDay": null,
    "documents": [],
    "resultDate": "2026-07-23",
    "resultDDay": "D-10"
  }
]
```

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| name | String | 제도명 |
| deadline | String \| null | 신청 마감일 |
| deadlineDDay | String \| null | 신청 마감일 기준 D-day. 예: `D-Day`, `D-7`, `D+3` |
| documents | String[] | 신청 마감일 카드에 표시할 필요 서류 |
| resultDate | String \| null | 결과 발표일 |
| resultDDay | String \| null | 결과 발표일 기준 D-day |

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

### 알림 목록 조회

종 아이콘 클릭 시 표시할 알림 목록을 최신순으로 조회합니다.

- 이 API 호출 시 서버가 알림을 모두 읽음 처리합니다.
- 별도의 읽음 처리 API는 없습니다.
- `relativeTime`은 서버가 계산해 내려줍니다.
- 유형별 아이콘/문구는 프론트가 `notificationType` 값으로 처리합니다.
- 알림 탭 시 제도 박스로 이동할 수 있도록 `policyId`를 포함합니다.

**Request**

`GET /api/app/users/me/notifications`

Request Body 없음.

**Response `200 OK`**

```json
[
  {
    "notificationId": 501,
    "policyId": 5,
    "policyName": "가족돌봄청년 일상돌봄",
    "notificationType": "DEADLINE_D7",
    "sentAt": "2026-07-06T10:00:00+09:00",
    "relativeTime": "1일 전"
  },
  {
    "notificationId": 500,
    "policyId": 8,
    "policyName": "청년 마음건강 바우처",
    "notificationType": "RESULT_DDAY",
    "sentAt": "2026-07-01T09:00:00+09:00",
    "relativeTime": "2주 전"
  }
]
```

| notificationType | 의미 |
| --- | --- |
| DEADLINE_D7 | 신청 마감 7일 전 |
| DEADLINE_D3 | 신청 마감 3일 전 |
| DEADLINE_D1 | 신청 마감 1일 전 |
| RESULT_DDAY | 결과 발표 당일 |

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

## 앱 투두 관리

### 투두 목록 조회

로그인한 유저가 저장한 제도들의 서류 체크리스트를 조회합니다. 앱의 신청 일정/투두리스트 화면에서 사용합니다.

- 저장한 제도가 없으면 `[]`를 반환합니다.
- 날짜별 그룹핑은 프론트에서 `deadline` 기준으로 처리합니다.
- 신청 마감일이 지난 제도는 응답에서 제외합니다.

**Request**

`GET /api/app/users/me/todos`

Request Body 없음.

**Response `200 OK`**

```json
[
  {
    "savedPolicyId": 42,
    "policyId": 5,
    "policyName": "가족돌봄청년 일상돌봄",
    "deadline": "2026-07-13",
    "sourceUrl": "https://...",
    "documents": [
      {
        "todoId": 101,
        "documentId": 1,
        "name": "가족관계증명서",
        "issuers": [
          {
            "issuer": "정부24",
            "site": "https://..."
          }
        ],
        "isChecked": false
      },
      {
        "todoId": 102,
        "documentId": 2,
        "name": "진단서",
        "issuers": [
          {
            "issuer": "담당 병원",
            "site": null
          }
        ],
        "isChecked": true
      }
    ]
  }
]
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 401 | `로그인이 필요합니다.` | 인증 실패 |

### 투두 체크/체크 해제

투두리스트 화면에서 서류 체크박스를 클릭했을 때 체크 상태를 변경합니다.

**Request**

`PATCH /api/app/users/me/todos/{todoId}`

```json
{
  "isChecked": true
}
```

| Path Variable | 타입 | 설명 |
| --- | --- | --- |
| todoId | Integer | 변경할 투두 항목 ID |

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| isChecked | Boolean | Y | 체크 시 `true`, 해제 시 `false` |

**Response `200 OK`**

```json
{
  "message": "체크 상태가 변경되었습니다."
}
```

**Errors**

| Status | message | 조건 |
| --- | --- | --- |
| 400 | `값이 누락되었습니다.` | `isChecked` 누락 |
| 401 | `로그인이 필요합니다.` | 인증 실패 |
| 404 | `존재하지 않는 투두 항목입니다.` | todoId 없음 또는 본인 소유 아님 |

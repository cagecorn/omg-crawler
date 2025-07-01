export const SETTINGS = {
    TILE_SIZE: 192,
    DEFAULT_ZOOM: 0.6,
    // 포그 오브 워 표시 여부를 제어합니다.
    ENABLE_FOG_OF_WAR: false,
    // AI의 인간적인 실수 허용 여부를 제어합니다.
    ENABLE_MISTAKE_ENGINE: false,
    // 길찾기 연산을 Web Worker에서 처리할지 여부입니다.
    // Web workers cause import issues in some environments.
    // Disable by default until the worker module is refactored.
    ENABLE_PATHFINDING_WORKER: false,
    // 아군 사이 MBTI 알파벳 친밀도에 따른 이동 보정 기능
    ENABLE_MBTI_INFLUENCE: false,
    // TensorFlow 기반 길찾기 모델 사용 여부입니다.
    // 모델 파일이 없거나 실험적인 기능을 끄고 싶다면 false로 두세요.
    ENABLE_TENSORFLOW_PATHING: false,
    // WebGL 렌더러 사용 여부입니다.
    // WebGL renderer is experimental and lacks Canvas2D method wrappers.
    // Use the 2D canvas renderer by default for stability.
    ENABLE_WEBGL_RENDERER: false,
    // 평판 시스템 사용 여부입니다. 성능 문제가 있을 때 비활성화하면
    // 메모리 기록과 모델 로드를 생략해 속도를 높일 수 있습니다.
    ENABLE_REPUTATION_SYSTEM: false,
    // 유령 빙의 AI 시스템 사용 여부입니다.
    ENABLE_POSSESSION_SYSTEM: false,
    // Aquarium map uses a 3-lane layout with jungle maze by default.
    // Set this to false to revert to a standard dungeon layout.
    ENABLE_AQUARIUM_LANES: false,
    // guideline markdown files will be loaded from this GitHub API path
    // example: 'user/repo/contents/guidelines?ref=main'
    // Remote markdown guidelines are fetched via the GitHub API.
    // Specify the path in 'owner/repo/contents/<folder>?ref=branch' format.
    GUIDELINE_REPO_URL: "cagecorn/doom-crawler-newest/contents/TensorFlow%27s%20room?ref=main",
    // 이동 속도는 StatManager의 'movement' 스탯으로부터 파생됩니다.
    // ... 나중에 더 많은 설정 추가
};

export class InputHandler {
    // 생성자를 수정하여 game 객체를 받습니다.
    constructor(game) {
        this.game = game;
        this.keysPressed = {};
        this._setupListeners();
    }

    _setupListeners() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => {
            delete this.keysPressed[event.key];
        });
        // 추가: 마우스 휠 이벤트 리스너
        document.addEventListener('wheel', (e) => this.handleMouseWheel(e), { passive: false });
    }

    handleKeyDown(e) {
        this.keysPressed[e.key] = true;
        switch (e.key) {
            case 'd': // 'D' 키를 누르면 데이터 다운로드
                this.game?.dataRecorder?.downloadData();
                break;
            default:
                break;
        }
        if (['1', '2', '3', '4'].includes(e.key)) {
            this.game.eventManager?.publish('key_pressed', { key: e.key });
        }
    }

    // 추가: 마우스 휠 이벤트를 처리하는 메서드
    handleMouseWheel(e) {
        const uiManager = this.game.uiManager;

        // 조건 1: 장비창이 열려있는 경우 -> 캐릭터 전환
        if (uiManager.characterSheetPanel && !uiManager.characterSheetPanel.classList.contains('hidden')) {
            // 장비창이 열려있을 땐 기본 스크롤/줌 동작을 막습니다.
            e.preventDefault();

            const party = this.game.getPartyMembers();
            if (party.length <= 1) return;

            const currentId = uiManager.currentCharacterId;
            const currentIndex = party.findIndex(member => member.id === currentId);

            if (currentIndex === -1) return;

            let nextIndex;
            if (e.deltaY < 0) { // 휠을 위로: 이전 캐릭터
                nextIndex = (currentIndex - 1 + party.length) % party.length;
            } else { // 휠을 아래로: 다음 캐릭터
                nextIndex = (currentIndex + 1) % party.length;
            }

            const nextCharacter = party[nextIndex];
            uiManager.displayCharacterSheet(nextCharacter);
        }
        // 조건 2: 그 외의 모든 경우 -> 카메라 확대/축소
        else {
            // 기존 게임 로직과 호환되도록 이벤트 매니저에 휠 정보를 전달한다.
            // game.js에서는 'mouse_wheel' 이벤트를 구독하여 zoomLevel을 조절한다.
            this.game.eventManager?.publish('mouse_wheel', { direction: e.deltaY });
        }
    }
}

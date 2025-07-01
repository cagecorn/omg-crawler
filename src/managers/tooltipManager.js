export class TooltipManager {
    constructor() {
        this.tooltipElement = document.getElementById('tooltip');
        if (!this.tooltipElement) {
            console.error('Tooltip element not found in the DOM!');
        }
    }

    /**
     * 툴팁을 표시합니다.
     * @param {string} htmlContent - 툴팁에 표시될 HTML 내용
     * @param {MouseEvent} event - 마우스 이벤트 객체
     */
    show(htmlContent, event) {
        if (!this.tooltipElement) return;
        this.tooltipElement.innerHTML = htmlContent;
        this.tooltipElement.classList.remove('hidden');
        this.updatePosition(event);
    }

    /**
     * 툴팁을 숨깁니다.
     */
    hide() {
        if (!this.tooltipElement) return;
        this.tooltipElement.classList.add('hidden');
    }

    /**
     * 마우스 위치에 따라 툴팁 위치를 업데이트합니다.
     * @param {MouseEvent} event - 마우스 이벤트 객체
     */
    updatePosition(event) {
        if (!this.tooltipElement) return;

        let x = event.pageX + 10;
        let y = event.pageY + 10;

        // 툴팁이 화면 밖으로 나가지 않도록 위치 조정
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const tooltipRect = this.tooltipElement.getBoundingClientRect();

        if (x + tooltipRect.width > screenWidth) {
            x = event.pageX - tooltipRect.width - 10;
        }
        if (y + tooltipRect.height > screenHeight) {
            y = event.pageY - tooltipRect.height - 10;
        }

        this.tooltipElement.style.left = `${x}px`;
        this.tooltipElement.style.top = `${y}px`;
    }

    /**
     * 지정된 DOM 요소에 툴팁 표시/숨김 이벤트를 연결합니다.
     * @param {HTMLElement} element - 이벤트를 연결할 요소
     * @param {string | function} content - 툴팁에 표시할 내용 (문자열 또는 함수)
     */
    attach(element, content) {
        element.addEventListener('mouseenter', (e) => {
            const html = typeof content === 'function' ? content() : content;
            this.show(html, e);
        });
        element.addEventListener('mouseleave', () => {
            this.hide();
        });
        element.addEventListener('mousemove', (e) => {
            this.updatePosition(e);
        });
    }
}

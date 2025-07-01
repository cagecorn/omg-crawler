export class BgmManager {
    constructor(eventManager = null, assets = null) {
        this.eventManager = eventManager;
        this.tracks = [];
        this.currentIndex = 0;
        this.audio = null;
        this.isInitialized = false;

        if (typeof window !== 'undefined') {
            this._discoverTracks();
        }
    }

    _discoverTracks() {
        // Predefine track names for now. Future tracks should follow 'bgm_X.mp3'
        const trackNames = ['bgm_1'];
        this.tracks = trackNames.map(name => `assets/bgm/${name}.mp3`);
    }

    start() {
        if (typeof window === 'undefined' || !this.tracks.length) return;

        if (!this.audio) {
            this.audio = new Audio();
            this.audio.volume = 0.5;
            this.audio.addEventListener('ended', () => this.next());
        }
        this.playCurrent();
        this.isInitialized = true;
    }

    playCurrent() {
        if (!this.audio) return;
        this.audio.src = this.tracks[this.currentIndex];
        this.audio.currentTime = 0;
        this.audio.play().catch(() => {});
    }

    next() {
        if (!this.tracks.length) return;
        this.currentIndex = (this.currentIndex + 1) % this.tracks.length;
        this.playCurrent();
    }
}

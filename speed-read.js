const sleep = async function(time) {
	return new Promise(resolve => setTimeout(resolve, time));
};

const insertContainer = function() {
	let container = document.createElement('div');
	container.id = 'speed-read-container';
	const repeatIcon = 'svg'
	container.innerHTML = `
		<div class="speed-read-nav">
			<div class="speed-read-button-group speed-read-float-left">
				<span id="speed-read-restart-button">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-skip-back"><polygon points="19 20 9 12 19 4"></polygon><line x1="5" y1="19" x2="5" y2="5"></line></svg>
				</span>
				<span id="speed-read-back-5s">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rewind"><polygon points="11 19 2 12 11 5"></polygon><polygon points="22 19 13 12 22 5"></polygon></svg>
				</span>
                <span id="speed-read-pause">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rewind"><line x1="8" y1="19" x2="8" y2="5"></line><line x1="16" y1="19" x2="16" y2="5"></line></svg>
                </span>
                <span id="speed-read-resume" style="display:none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rewind"><polygon points="8 19 17 12 8 5"></polygon></svg>
                </span>
				<span id="speed-read-time-remaining"></span>
			</div>
			<div class="speed-read-button-group speed-read-float-right">
				<span id="speed-read-close-button">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				</span>
			</div>
			<div class="speed-read-clearfix"></div>
			<div class="speed-read-range">
				<input type="range" min=0 max=1 id="speed-read-range" />
			</div>
		</div>
		<div id="speed-read-center-text"></div>
	`;
	document.body.appendChild(container);
};

class SpeedRead {
	constructor(tokens, settings) {
		this.tokens = tokens;
		this.cancelled = false;
        this.paused = false;
        this.counter = 0;
        this.totalTokens = tokens.length;

        this.nodes = {
            container: document.getElementById('speed-read-container'),
            centerText: document.getElementById('speed-read-center-text'),
            pause: document.getElementById('speed-read-pause'),
            resume: document.getElementById('speed-read-resume'),
            range: document.getElementById('speed-read-range'),
            close: document.getElementById('speed-read-close-button'),
            restart: document.getElementById('speed-read-restart-button'),
            rewind: document.getElementById('speed-read-back-5s'),
        };
        this.prepareDOM();

	}

    prepareDOM() {
        this.nodes.pause.addEventListener('click', e => this.setPaused(true));
        this.nodes.resume.addEventListener('click', e => this.setPaused(false));
        this.nodes.container.addEventListener('click', e => {
            // This conditional is ugly and probably will lead to a bug in the future
            // TODO: remove this
            if (e.originalTarget == this.nodes.container ||
                e.originalTarget == this.nodes.centerText) {
                this.setPaused(!this.paused);
            }
        });

        this.nodes.range.setAttribute('max', this.totalTokens - 1);
        this.nodes.range.addEventListener('change', e => {
            this.counter = parseInt(e.target.value);
            this.calculateTimeRemaining();
        });

        this.nodes.restart.addEventListener('click', e => this.restart());
        this.nodes.rewind.addEventListener('click', e => this.rewind());
        this.nodes.close.addEventListener('click', e => this.cancel());

        this.calculateTimeRemaining();
    }

    openContainer() {
        this.nodes.container.classList.add('active');
        window.scrollTo(0, 0);
    }

	isCancelled() {
		return this.cancelled;
	}

	cancel() {
		this.cancelled = true;
        this.nodes.container.classList.remove('active');
	}

    isPaused() {
        return this.paused;
    }

    setPaused(val) {
        this.paused = val;
        if (val) {
            this.nodes.pause.style.display = 'none';
            this.nodes.resume.style.display = 'initial';
        } else {
            this.nodes.pause.style.display = 'initial';
            this.nodes.resume.style.display = 'none';
        }
    }

    togglePaused() {
        this.setPaused(!this.paused);
    }

	increment() {
		if (this.totalTokens - this.counter > 1) {
			this.timeRemaining -= this.tokens[this.counter][2];
			this.counter += 1;
			this.nodes.range.value = this.counter;
		}
	}

	restart() {
		this.counter = 0;
		this.calculateTimeRemaining();
	}

	rewind(time = 5000) {
		while (time > 0) {
			time = time - this.tokens[this.counter][2];
			this.counter -= 1;
		}
		this.calculateTimeRemaining();
	}

	calculateTimeRemaining() {
		const tokens = this.tokens.slice(this.counter);
		this.timeRemaining = tokens.reduce(function(time, token) {
			return time + token[2];
		}, 0);
	}

	getHumanReadableTimeRemaining() {
		const minutes = Math.floor(this.timeRemaining / (1000 * 60));
		if (minutes > 1) {
			return minutes + ' minutes left';
		}
		if (minutes == 1) {
			return minutes + ' minute left';
		}
		const seconds = Math.floor(this.timeRemaining / 1000);
		return seconds + ' seconds left';
	}
}

const run = async function(settings) {
    let articleContent = readability.grabArticle();
    articleContent = [...articleContent.childNodes[0].childNodes];

    const wait = {
        WORD: 60000 / parseInt(settings.wpm),
        PARAGRAPH_END: parseInt(settings.paragraph_end),
        IMAGE: parseInt(settings.image),
        ARTICLE_END: 1000,
    };
    const tokens = parseArticle(articleContent, wait);
    const speedRead = new SpeedRead(tokens, settings);

    const centerText = document.getElementById('speed-read-center-text');
    const timeRemaining = document.getElementById('speed-read-time-remaining')

    const togglePauseIfSpacePressed = e => {
        const key = e.keyCode ? e.keyCode : e.which;
        if (key == 32) {
            speedRead.togglePaused();
        }
    };
    document.addEventListener('keyup', togglePauseIfSpacePressed);

    speedRead.openContainer();
    while (!speedRead.isCancelled()) {
    	const [val, type, delay] = speedRead.tokens[speedRead.counter];
    	timeRemaining.textContent = speedRead.getHumanReadableTimeRemaining();
        while (speedRead.isPaused()) {
            await sleep(500);
        }
    	switch (type) {
    		case TokenName.WORD:
    			centerText.textContent = val;
    			await sleep(delay);
    			break;
            case TokenName.IMAGE:
                centerText.innerHTML = `
                    <img src="${val.url}" class="speed-read-image" />
                    <p class="speed-read-image-caption">${val.caption}</p>
                `;
                if (settings.pause_img) {
                    speedRead.setPaused(true);
                } else {
                    await sleep(wait.IMAGE);
                }
                break;
    		case TokenName.PARAGRAPH_END:
    		case TokenName.ARTICLE_END:
    			await sleep(delay);
    			break;
    	}
    	speedRead.increment();
    }

    document.removeEventListener('keyup', togglePauseIfSpacePressed);
};

insertContainer();
browser.runtime.onMessage.addListener(function(settings) {
	run(settings);
})

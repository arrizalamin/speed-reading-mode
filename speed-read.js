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
		<p id="speed-read-center-text"></p>
	`;
	document.body.appendChild(container);
};

class SpeedRead {
	constructor(article, settings) {
		this.article = article;
		this.cancelled = false;
        this.paused = false;
		this.delays = {
			WORD: 60000 / parseInt(settings.wpm),
			PARAGRAPH_END: parseInt(settings.paragraph_end),
		};
		this.type = {
			WORD: 0,
			PARAGRAPH_END: 1,
			ARTICLE_END: 2,
		};
        this.nodes = {
            container: document.getElementById('speed-read-container'),
            centerText: document.getElementById('speed-read-center-text'),
            pause: document.getElementById('speed-read-pause'),
            resume: document.getElementById('speed-read-resume'),
            range: document.getElementById('speed-read-range'),
        };

		this.buildIndexes();
		this.counter = 0;
		this.totalIndex = this.indexes.length;

        this.nodes.container.addEventListener('click', function(e) {
            // This conditional is ugly and probably will lead to a bug in the future
            // TODO: remove this
            if (e.originalTarget == this.nodes.container ||
                e.originalTarget == this.nodes.centerText) {
                this.setPaused(!this.paused);
            }
        }.bind(this));

        this.nodes.pause.addEventListener('click', function(e) {
            this.setPaused(true);
        }.bind(this));
        this.nodes.resume.addEventListener('click', function(e) {
            this.setPaused(false);
        }.bind(this));

		this.nodes.range.setAttribute('max', this.totalIndex - 1);
		this.nodes.range.addEventListener('change', function(e) {
            this.counter = parseInt(e.target.value);
            this.calculateTimeRemaining();
		}.bind(this));

		this.calculateTimeRemaining();
	}

	isCancelled() {
		return this.cancelled;
	}

	cancel() {
		this.cancelled = true;
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

	increment() {
		if (this.totalIndex - this.counter > 1) {
			this.timeRemaining -= this.indexes[this.counter][2];
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
			time = time - this.indexes[this.counter][2];
			this.counter -= 1;
		}
		this.calculateTimeRemaining();
	}

	buildIndexes() {
		const delays = this.delays;
		const type = this.type;
	    let indexes = this.article.filter(tag => tag.nodeName == 'P');
	    indexes = indexes.reduce(function(list, paragraph) {
	    	const tokens = paragraph.innerText.split(' ');
	    	const indexes = tokens.reduce(function(carry, word) {
	    		return [...carry, [word, type.WORD, delays.WORD]]
	    	}, []);
	    	return [...list, ...indexes, ['', type.PARAGRAPH_END, delays.PARAGRAPH_END]];
	    }, []);
	    this.indexes = [...indexes, ['', type.ARTICLE_END, 1000]];
	}

	calculateTimeRemaining() {
		const indexes = this.indexes.slice(this.counter);
		this.timeRemaining = indexes.reduce(function(time, index) {
			return time + index[2];
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

const openContainer = async function(settings) {
    let articleContent = readability.grabArticle();
    articleContent = [...articleContent.childNodes[0].childNodes];
    articleContent = articleContent.filter(tag => tag.nodeName == 'P');

    const container = document.getElementById('speed-read-container');
    container.classList.add('active');
    window.scrollTo(0, 0);
    const closeButton = document.getElementById('speed-read-close-button');
    const restartButton = document.getElementById('speed-read-restart-button');
    const rewindButton = document.getElementById('speed-read-back-5s');

    const speedRead = new SpeedRead(articleContent, settings);

    closeButton.addEventListener('click', function() {
    	speedRead.cancel();
    	container.classList.remove('active');
    });
    restartButton.addEventListener('click', () => speedRead.restart());
    rewindButton.addEventListener('click', () => speedRead.rewind());
    run(speedRead);
};

const run = async function(speedRead) {
    const centerText = document.getElementById('speed-read-center-text');
    const timeRemaining = document.getElementById('speed-read-time-remaining')

    while (!speedRead.isCancelled()) {
    	const [val, type, delay] = speedRead.indexes[speedRead.counter];
    	timeRemaining.textContent = speedRead.getHumanReadableTimeRemaining();
        while (speedRead.isPaused()) {
            await sleep(500);
        }
    	switch (type) {
    		case speedRead.type.WORD:
    			centerText.textContent = val;
    			await sleep(delay);
    			break;
    		case speedRead.type.PARAGRAPH_END:
    		case speedRead.type.ARTICLE_END:
    			await sleep(delay);
    			break;
    	}
    	speedRead.increment();
    }
};

insertContainer();
browser.runtime.onMessage.addListener(function(settings) {
	openContainer(settings);
})

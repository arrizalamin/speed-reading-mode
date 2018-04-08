const TokenName = {
	WORD: 0,
	PARAGRAPH_END: 1,
	ARTICLE_END: 2,
	IMAGE: 3,
};

const paragraphParser = (node, wait) => {
	const tokensVal = node.innerText.split(' ');
	const tokens = tokensVal.reduce(function(list, word) {
		return [...list, [word, TokenName.WORD, wait.WORD]]
	}, []);
	const endToken = ['', TokenName.PARAGRAPH_END, wait.PARAGRAPH_END];
	return [...tokens, endToken];
}

const figureParser = (node, wait) => {
	const imageNodes = [...node.querySelectorAll('img')];
	const figureCaptionNode = node.querySelector('figcaption');
	let caption = '';
	if (figureCaptionNode != null) {
		figureCaptionNode.innerText;
	}
	return imageNodes.map(imageNode => {
		const url = imageNode.getAttribute('src');
		if (caption == '' && imageNode.getAttribute('alt') != null) {
			caption = imageNode.getAttribute('alt');
		}
		return [{url, caption}, TokenName.IMAGE, wait.IMAGE];
	});
}

const parseArticle = (article, wait) => {
	const tokens = article.reduce(function(parsed, node) {
		if (node.tagName == 'P') {
			parsedParagraph = paragraphParser(node, wait);
			return [...parsed, ...parsedParagraph];
		}
		if (node.tagName == 'FIGURE') {
			parsedFigure = figureParser(node, wait);
			return [...parsed, ...parsedFigure];
		}
		return parsed;
	}, []);
	return [...tokens, ['', TokenName.ARTICLE_END, wait.ARTICLE_END]];
}

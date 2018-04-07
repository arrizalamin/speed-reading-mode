const TokenName = {
	WORD: 0,
	PARAGRAPH_END: 1,
	ARTICLE_END: 2,
};

const paragraphParser = (node, wait) => {
	const tokensVal = node.innerText.split(' ');
	const tokens = tokensVal.reduce(function(list, word) {
		return [...list, [word, TokenName.WORD, wait.WORD]]
	}, []);
	const endToken = ['', TokenName.PARAGRAPH_END, wait.PARAGRAPH_END];
	return [...tokens, endToken];
}


const parseArticle = (article, wait) => {
	const tokens = article.reduce(function(parsed, node) {
		if (node.tagName == 'P') {
			parsedParagraph = paragraphParser(node, wait);
			return [...parsed, ...parsedParagraph];
		}
		return parsed;
	}, []);
	return [...tokens, ['', TokenName.ARTICLE_END, wait.ARTICLE_END]];
}

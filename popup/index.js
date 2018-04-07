const sendMessage = settings => tabs => {
	for (const tab of tabs) {
		browser.tabs.sendMessage(tab.id, settings)
		.then(console.log)
		.catch(console.error);
	}
}

const form = document.getElementById('popup-form');
form.addEventListener("submit", function(e) {
	e.preventDefault();

	const formData = new FormData(form);
	const formDataObj = [...formData.entries()].reduce(function(obj, [key, val]) {
		return Object.assign(obj, {[key]:val});
	}, {})
	browser.storage.local.set(formDataObj);

	browser.tabs.query({
		currentWindow: true,
		active: true
	})
	.then(sendMessage(formDataObj))
	.then(() => window.close())
	.catch(console.error);
});

window.addEventListener('load', function() {
	browser.storage.local.get()
	.then(function(data) {
		for (const key in data) {
			document.getElementById(key).value = data[key];
		}
	})
});

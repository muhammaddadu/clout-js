function getJokes(div) {
	div.html('');
	$.getJSON('/api/jokes', function (data) {
		var jokes = data.data.value;
		div.append('<ul>');
		jokes.forEach(function (joke) {
			div.append('<li>' + joke.joke + '</li>')
		});
		div.append('</ul>');
	});
}
let app;

module.exports = (request, response) => {
	try {
		require('sqlite3');
		app ||= require('../backend/server');
		return app(request, response);
	} catch (error) {
		console.error('API startup failed:', error);
		return response.status(500).json({ error: 'The API could not start. Check the Vercel function logs.' });
	}
};
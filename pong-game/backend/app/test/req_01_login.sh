curl -X POST http://localhost:8000/api/user/login/ \
	-H "Content-Type: application/json" \
	-d '{
		"username": "alex",
		"password": "alex"
	}'
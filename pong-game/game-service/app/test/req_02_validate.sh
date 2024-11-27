curl -X POST http://localhost:8000/api/user/token/validate/ \
	-H "Content-Type: application/json" \
	-d '{
		"user_id": "2",
		"otp_code": "409075"
	}'
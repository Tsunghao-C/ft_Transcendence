curl -X POST http://localhost:8000/api/user/2FA/validate/ \
	-H "Content-Type: application/json" \
	-d '{
		"user_id": "2",
		"otp": "409075"
	}'
import json
import requests
import unittest
from datetime import datetime

class TestLambdaFunction(unittest.TestCase):
    LAMBDA_URL = "https://2ml24s4a3jfj5hqx4y644cgzbq0jbzmt.lambda-url.us-east-2.on.aws/"
    
    def test_successful_response(self):
        # 테스트 데이터 준비
        test_data = {
            "user_name": "테스트사용자",
            "phone_number": "01012345678",
            "english_word": "test",
            "round_number": 1,
            "page_type": "recognition",
            "duration": 10,
            "response": "테스트"
        }
        
        # API 요청 보내기
        response = requests.post(
            self.LAMBDA_URL,
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        # 응답 확인
        self.assertEqual(response.status_code, 200)
        
        # 응답 데이터 확인
        response_data = response.json()
        self.assertEqual(response_data["statusCode"], 200)
        self.assertEqual(response_data["body"]["user_name"], test_data["user_name"])
        self.assertEqual(response_data["body"]["phone_number"], test_data["phone_number"])
        self.assertEqual(response_data["body"]["english_word"], test_data["english_word"])
        
    def test_missing_required_fields(self):
        # 필수 필드가 누락된 테스트 데이터
        test_data = {
            "user_name": "테스트사용자",
            "phone_number": "01012345678"
            # 다른 필수 필드들이 누락됨
        }
        
        # API 요청 보내기
        response = requests.post(
            self.LAMBDA_URL,
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        # 에러 응답 확인
        self.assertEqual(response.status_code, 200)  # Lambda는 항상 200을 반환
        response_data = response.json()
        self.assertIn("error", response_data["body"])

if __name__ == '__main__':
    unittest.main() 
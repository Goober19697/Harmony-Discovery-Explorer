import unittest
from unittest.mock import patch

from app import app


class VoicingRouteTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    @patch("routes.voicings.list_voicings", return_value=[])
    def test_get_empty_returns_200_with_empty_array(self, _list_voicings):
        response = self.client.get("/api/voicings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"voicings": []})

    @patch("routes.voicings.list_voicings")
    def test_get_returns_existing_records_newest_first(self, list_voicings_mock):
        list_voicings_mock.return_value = [
            {
                "id": 2,
                "notes": "A2 C3 E3",
                "chord_name": "Am",
                "emotion": "sad",
                "created_at": "2026-07-25T13:00:00+00:00",
            },
            {
                "id": 1,
                "notes": "C3 E3 G3",
                "chord_name": "C",
                "emotion": "warm",
                "created_at": "2026-07-25T12:00:00+00:00",
            },
        ]

        response = self.client.get("/api/voicings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.get_json()["voicings"]],
            [2, 1],
        )

    @patch("routes.voicings.remove_voicing", return_value=True)
    def test_delete_voicing_returns_200(self, remove_voicing):
        response = self.client.delete("/api/voicings/7")
        self.assertEqual(response.status_code, 200)
        remove_voicing.assert_called_once_with(7)

    @patch("routes.voicings.remove_voicing", return_value=False)
    def test_delete_voicing_returns_404(self, _remove_voicing):
        response = self.client.delete("/api/voicings/999")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()

import unittest
from unittest.mock import patch

from app import app
from services.voicing_service import update_voicing


class VoicingServiceTests(unittest.TestCase):
    @patch("services.voicing_service.update_voicing_record")
    def test_favorite_update_preserves_other_fields(self, update_record):
        update_voicing(1, 7, {"favorite": True})
        update_record.assert_called_once_with(1, 7, True)

    def test_favorite_must_be_boolean(self):
        with self.assertRaisesRegex(ValueError, "boolean"):
            update_voicing(1, 7, {"favorite": "yes"})


class VoicingRouteTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session["user_id"] = 1

    @patch("routes.voicings.list_voicings", return_value=[])
    def test_get_empty_returns_200_with_empty_array(self, _list_voicings):
        response = self.client.get("/api/voicings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"voicings": []})
        _list_voicings.assert_called_once_with(1)

    @patch("routes.voicings.list_voicings")
    def test_get_returns_existing_records_newest_first(self, list_voicings_mock):
        list_voicings_mock.return_value = [
            {
                "id": 2,
                "notes": "A2 C3 E3",
                "chord_name": "Am",
                "emotion": "sad",
                "created_at": "2026-07-25T13:00:00+00:00",
                "favorite": True,
            },
            {
                "id": 1,
                "notes": "C3 E3 G3",
                "chord_name": "C",
                "emotion": "warm",
                "created_at": "2026-07-25T12:00:00+00:00",
                "favorite": False,
            },
        ]

        response = self.client.get("/api/voicings")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.get_json()["voicings"]],
            [2, 1],
        )
        self.assertEqual(response.get_json()["voicings"][0]["favorite"], True)
        list_voicings_mock.assert_called_once_with(1)

    @patch("routes.voicings.update_voicing")
    def test_patch_voicing_favorite_returns_updated_record(self, update_voicing_mock):
        update_voicing_mock.return_value = {
            "id": 7,
            "notes": "A3 C4 E4 G4",
            "chord_name": "Am7",
            "emotion": "Warm & At Rest",
            "created_at": "2026-07-25T12:00:00+00:00",
            "favorite": True,
        }
        response = self.client.patch("/api/voicings/7", json={"favorite": True})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["voicing"]["favorite"], True)
        update_voicing_mock.assert_called_once_with(1, 7, {"favorite": True})

    @patch("routes.voicings.remove_voicing", return_value=True)
    def test_delete_voicing_returns_200(self, remove_voicing):
        response = self.client.delete("/api/voicings/7")
        self.assertEqual(response.status_code, 200)
        remove_voicing.assert_called_once_with(1, 7)

    @patch("routes.voicings.remove_voicing", return_value=False)
    def test_delete_voicing_returns_404(self, _remove_voicing):
        response = self.client.delete("/api/voicings/999")
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()

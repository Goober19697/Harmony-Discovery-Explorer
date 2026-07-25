import unittest
from unittest.mock import patch

from app import app
from services.progression_service import create_progression


class ProgressionServiceTests(unittest.TestCase):
    @patch("services.progression_service.insert_progression")
    def test_create_progression_preserves_step_order(self, insert_progression):
        steps = [
            {"chord_name": "C", "notes": "C3 E3 G3"},
            {"chord_name": "Am", "notes": "A2 C3 E3", "emotion": "sad"},
        ]
        insert_progression.return_value = {
            "id": 1,
            "title": "Untitled Progression",
            "progression": steps,
            "created_at": "2026-07-25T12:00:00+00:00",
        }

        create_progression({"title": "", "progression": steps})

        insert_progression.assert_called_once_with(
            title="Untitled Progression",
            progression=steps,
        )

    def test_create_progression_rejects_empty_steps(self):
        with self.assertRaisesRegex(ValueError, "non-empty list"):
            create_progression({"progression": []})

    def test_create_progression_rejects_a_step_without_notes(self):
        with self.assertRaisesRegex(ValueError, "step 1 requires notes"):
            create_progression({"progression": [{"chord_name": "C"}]})


class ProgressionRouteTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()

    def test_invalid_data_returns_400(self):
        response = self.client.post("/api/progressions", json={"progression": []})
        self.assertEqual(response.status_code, 400)

    @patch("routes.progressions.create_progression")
    def test_success_returns_201(self, create_progression_mock):
        create_progression_mock.return_value = {
            "id": 1,
            "title": "Untitled Progression",
            "progression": [{"chord_name": "C", "notes": "C3 E3 G3"}],
            "created_at": "2026-07-25T12:00:00+00:00",
        }

        response = self.client.post(
            "/api/progressions",
            json={
                "title": "Untitled Progression",
                "progression": [{"chord_name": "C", "notes": "C3 E3 G3"}],
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["message"], "Progression saved")

    @patch("routes.progressions.create_progression")
    def test_database_error_returns_500(self, create_progression_mock):
        create_progression_mock.side_effect = RuntimeError("database unavailable")

        response = self.client.post(
            "/api/progressions",
            json={"progression": [{"chord_name": "C", "notes": "C3 E3 G3"}]},
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_json()["error"], "Unable to save progression")


if __name__ == "__main__":
    unittest.main()

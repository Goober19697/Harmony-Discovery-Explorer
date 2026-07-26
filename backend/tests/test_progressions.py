import unittest
from unittest.mock import patch

from app import app
from services.progression_service import create_progression, update_progression


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

        create_progression(1, {"title": "", "progression": steps})

        insert_progression.assert_called_once_with(
            user_id=1,
            title="Untitled Progression",
            progression=steps,
        )

    def test_create_progression_rejects_empty_steps(self):
        with self.assertRaisesRegex(ValueError, "non-empty list"):
            create_progression(1, {"progression": []})

    def test_create_progression_rejects_a_step_without_notes(self):
        with self.assertRaisesRegex(ValueError, "step 1 requires notes"):
            create_progression(1, {"progression": [{"chord_name": "C"}]})

    @patch("services.progression_service.update_progression_record")
    def test_update_progression_preserves_remaining_step_order(self, update_record):
        steps = [
            {"chord_name": "C", "notes": "C3 E3 G3"},
            {"chord_name": "G", "notes": "G3 B3 D4"},
        ]
        update_progression(1, 7, {"progression": steps})
        update_record.assert_called_once_with(
            1, 7, title=None, progression=steps, favorite=None
        )

    @patch("services.progression_service.update_progression_record")
    def test_title_update_preserves_progression_and_normalizes_title(self, update_record):
        update_progression(1, 7, {"title": "  Midnight Resolve  "})
        update_record.assert_called_once_with(
            1,
            7,
            title="Midnight Resolve",
            progression=None,
            favorite=None,
        )

        update_progression(1, 7, {"title": "   "})
        self.assertEqual(
            update_record.call_args_list[1].kwargs["title"],
            "Untitled Progression",
        )

    def test_update_progression_rejects_an_empty_array(self):
        with self.assertRaisesRegex(ValueError, "non-empty list"):
            update_progression(1, 7, {"progression": []})

    @patch("services.progression_service.update_progression_record")
    def test_favorite_update_preserves_title_and_steps(self, update_record):
        update_progression(1, 7, {"favorite": True})
        update_record.assert_called_once_with(
            1,
            7,
            title=None,
            progression=None,
            favorite=True,
        )


class ProgressionRouteTests(unittest.TestCase):
    def setUp(self):
        app.config["TESTING"] = True
        self.client = app.test_client()
        with self.client.session_transaction() as session:
            session["user_id"] = 1

    def test_invalid_data_returns_400(self):
        response = self.client.post("/api/progressions", json={"progression": []})
        self.assertEqual(response.status_code, 400)

    @patch("routes.progressions.list_progressions", return_value=[])
    def test_get_empty_returns_200_with_empty_array(self, _list_progressions):
        response = self.client.get("/api/progressions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), {"progressions": []})
        _list_progressions.assert_called_once_with(1)

    @patch("routes.progressions.list_progressions")
    def test_get_returns_existing_records_newest_first(self, list_progressions_mock):
        list_progressions_mock.return_value = [
            {
                "id": 2,
                "title": "Newest",
                "progression": [{"chord_name": "Am", "notes": "A2 C3 E3"}],
                "created_at": "2026-07-25T13:00:00+00:00",
                "favorite": True,
            },
            {
                "id": 1,
                "title": "Older",
                "progression": [{"chord_name": "C", "notes": "C3 E3 G3"}],
                "created_at": "2026-07-25T12:00:00+00:00",
                "favorite": False,
            },
        ]

        response = self.client.get("/api/progressions")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            [item["id"] for item in response.get_json()["progressions"]],
            [2, 1],
        )
        self.assertEqual(response.get_json()["progressions"][0]["favorite"], True)
        list_progressions_mock.assert_called_once_with(1)

    @patch("routes.progressions.update_progression")
    def test_patch_returns_updated_progression(self, update_progression_mock):
        update_progression_mock.return_value = {
            "id": 7,
            "title": "My Changes",
            "progression": [{"chord_name": "G", "notes": "G3 B3 D4"}],
            "created_at": "2026-07-25T12:00:00+00:00",
        }
        response = self.client.patch(
            "/api/progressions/7",
            json={"progression": [{"chord_name": "G", "notes": "G3 B3 D4"}]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["progression"]["title"], "My Changes")
        update_progression_mock.assert_called_once_with(
            1,
            7,
            {"progression": [{"notes": "G3 B3 D4", "chord_name": "G"}]},
        )

    def test_patch_rejects_an_empty_progression(self):
        response = self.client.patch("/api/progressions/7", json={"progression": []})
        self.assertEqual(response.status_code, 400)

    @patch("routes.progressions.update_progression", return_value=None)
    def test_patch_returns_404_for_unknown_record(self, _update_progression):
        response = self.client.patch(
            "/api/progressions/999",
            json={"progression": [{"notes": "C3 E3 G3"}]},
        )
        self.assertEqual(response.status_code, 404)

    @patch("routes.progressions.remove_progression", return_value=True)
    def test_delete_progression_returns_200(self, remove_progression):
        response = self.client.delete("/api/progressions/7")
        self.assertEqual(response.status_code, 200)
        remove_progression.assert_called_once_with(1, 7)

    @patch("routes.progressions.remove_progression", return_value=False)
    def test_delete_progression_returns_404(self, _remove_progression):
        response = self.client.delete("/api/progressions/999")
        self.assertEqual(response.status_code, 404)

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
        create_progression_mock.assert_called_once_with(
            1,
            {
                "title": "Untitled Progression",
                "progression": [{"chord_name": "C", "notes": "C3 E3 G3"}],
            },
        )

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

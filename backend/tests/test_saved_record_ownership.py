import unittest
from unittest.mock import patch

from app import app


class SavedRecordOwnershipTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="test-secret")
        self.client = app.test_client()
        self.voicings = {
            90: {"owner": None, "record": {"id": 90, "notes": "Legacy"}},
        }
        self.progressions = {
            91: {
                "owner": None,
                "record": {
                    "id": 91,
                    "title": "Legacy",
                    "progression": [{"notes": "C3 E3 G3"}],
                },
            },
        }

        self.patchers = [
            patch("routes.voicings.create_voicing", side_effect=self.create_voicing),
            patch("routes.voicings.list_voicings", side_effect=self.list_voicings),
            patch("routes.voicings.update_voicing", side_effect=self.update_voicing),
            patch("routes.voicings.remove_voicing", side_effect=self.remove_voicing),
            patch(
                "routes.progressions.create_progression",
                side_effect=self.create_progression,
            ),
            patch(
                "routes.progressions.list_progressions",
                side_effect=self.list_progressions,
            ),
            patch(
                "routes.progressions.update_progression",
                side_effect=self.update_progression,
            ),
            patch(
                "routes.progressions.remove_progression",
                side_effect=self.remove_progression,
            ),
        ]
        for patcher in self.patchers:
            patcher.start()
            self.addCleanup(patcher.stop)

    def login_as(self, user_id):
        with self.client.session_transaction() as session:
            session.clear()
            session["user_id"] = user_id

    def create_voicing(self, user_id, data):
        record = {"id": 1, "notes": data["notes"], "favorite": False}
        self.voicings[1] = {"owner": user_id, "record": record}
        return record

    def list_voicings(self, user_id):
        return [
            item["record"]
            for item in self.voicings.values()
            if item["owner"] == user_id
        ]

    def update_voicing(self, user_id, voicing_id, data):
        item = self.voicings.get(voicing_id)
        if item is None or item["owner"] != user_id:
            return None
        item["record"]["favorite"] = data["favorite"]
        return item["record"]

    def remove_voicing(self, user_id, voicing_id):
        item = self.voicings.get(voicing_id)
        if item is None or item["owner"] != user_id:
            return False
        del self.voicings[voicing_id]
        return True

    def create_progression(self, user_id, data):
        record = {
            "id": 2,
            "title": data["title"],
            "progression": data["progression"],
            "favorite": False,
        }
        self.progressions[2] = {"owner": user_id, "record": record}
        return record

    def list_progressions(self, user_id):
        return [
            item["record"]
            for item in self.progressions.values()
            if item["owner"] == user_id
        ]

    def update_progression(self, user_id, progression_id, data):
        item = self.progressions.get(progression_id)
        if item is None or item["owner"] != user_id:
            return None
        item["record"].update(data)
        return item["record"]

    def remove_progression(self, user_id, progression_id):
        item = self.progressions.get(progression_id)
        if item is None or item["owner"] != user_id:
            return False
        del self.progressions[progression_id]
        return True

    def test_unauthenticated_saved_routes_return_401(self):
        self.assertEqual(
            self.client.post("/api/voicings", json={"notes": "C3 E3 G3"}).status_code,
            401,
        )
        self.assertEqual(self.client.get("/api/voicings").status_code, 401)
        self.assertEqual(
            self.client.post(
                "/api/progressions",
                json={"title": "I–V", "progression": [{"notes": "C3 E3 G3"}]},
            ).status_code,
            401,
        )
        self.assertEqual(self.client.get("/api/progressions").status_code, 401)

    def test_voicing_isolation_and_session_owned_create(self):
        self.login_as(1)
        response = self.client.post(
            "/api/voicings",
            json={"notes": "A3 C4 E4", "user_id": 2},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.voicings[1]["owner"], 1)
        self.assertNotIn("user_id", response.get_json()["voicing"])

        self.login_as(2)
        self.assertEqual(self.client.get("/api/voicings").get_json()["voicings"], [])
        self.assertEqual(
            self.client.patch("/api/voicings/1", json={"favorite": True}).status_code,
            404,
        )
        self.assertEqual(self.client.delete("/api/voicings/1").status_code, 404)

        self.login_as(1)
        self.assertEqual(
            self.client.patch("/api/voicings/1", json={"favorite": True}).status_code,
            200,
        )
        self.assertEqual(self.client.delete("/api/voicings/1").status_code, 200)

    def test_progression_isolation_for_every_update_shape(self):
        steps = [
            {"notes": "C3 E3 G3", "chord_name": "C"},
            {"notes": "G3 B3 D4", "chord_name": "G"},
        ]
        self.login_as(1)
        response = self.client.post(
            "/api/progressions",
            json={"title": "I–V", "progression": steps, "user_id": 2},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(self.progressions[2]["owner"], 1)
        self.assertNotIn("user_id", response.get_json()["progression"])

        self.login_as(2)
        self.assertEqual(
            self.client.get("/api/progressions").get_json()["progressions"],
            [],
        )
        for payload in (
            {"title": "Stolen"},
            {"favorite": True},
            {"progression": steps[:1]},
        ):
            self.assertEqual(
                self.client.patch("/api/progressions/2", json=payload).status_code,
                404,
            )
        self.assertEqual(self.client.delete("/api/progressions/2").status_code, 404)

        self.login_as(1)
        self.assertEqual(len(self.client.get("/api/progressions").get_json()["progressions"]), 1)
        for payload in (
            {"title": "Mine"},
            {"favorite": True},
            {"progression": steps[:1]},
        ):
            self.assertEqual(
                self.client.patch("/api/progressions/2", json=payload).status_code,
                200,
            )
        self.assertEqual(self.client.delete("/api/progressions/2").status_code, 200)


if __name__ == "__main__":
    unittest.main()

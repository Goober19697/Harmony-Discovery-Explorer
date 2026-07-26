import inspect
import unittest

from database import db


class DatabaseOwnershipTests(unittest.TestCase):
    def test_all_saved_record_queries_are_user_scoped(self):
        for function in (
            db.get_all_voicings,
            db.get_all_progressions,
            db.update_voicing_record,
            db.update_progression_record,
            db.delete_voicing,
            db.delete_progression,
        ):
            source = inspect.getsource(function)
            self.assertIn("user_id", source, function.__name__)
            self.assertIn("WHERE", source, function.__name__)

    def test_saved_record_inserts_require_server_supplied_user_id(self):
        voicing_source = inspect.getsource(db.insert_voicing)
        progression_source = inspect.getsource(db.insert_progression)

        self.assertIn("INSERT INTO voicings (user_id,", voicing_source)
        self.assertIn("INSERT INTO progressions (user_id,", progression_source)


if __name__ == "__main__":
    unittest.main()

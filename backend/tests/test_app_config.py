import os
import unittest
from unittest.mock import patch

from app import environment_port


class AppConfigurationTests(unittest.TestCase):
    def test_api_port_uses_integer_environment_value(self):
        with patch.dict(os.environ, {"API_PORT": "5001"}):
            self.assertEqual(environment_port("API_PORT", 5001), 5001)

    def test_api_port_rejects_invalid_or_out_of_range_values(self):
        for value in ("not-a-port", "0", "65536"):
            with self.subTest(value=value), patch.dict(
                os.environ, {"API_PORT": value}
            ):
                with self.assertRaisesRegex(ValueError, "API_PORT"):
                    environment_port("API_PORT", 5001)


if __name__ == "__main__":
    unittest.main()

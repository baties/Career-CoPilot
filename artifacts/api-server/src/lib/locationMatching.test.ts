import assert from "node:assert/strict";
import test from "node:test";
import { demoLocation, matchesLocationPreferences } from "./locationMatching";

const preferences = [
  { country: "United Arab Emirates", cities: ["Dubai"] },
  { country: "Canada", cities: ["Toronto", "Calgary"] },
  { country: "United Kingdom", cities: [] },
];

test("locations use OR across countries and cities, with country aliases", () => {
  for (const location of ["Dubai, UAE", "Dubai", "Toronto, Canada", "Calgary, CA", "London, UK", "Manchester, United Kingdom", "Scotland"]) {
    assert.equal(matchesLocationPreferences(location, preferences), true, location);
  }
});

test("unselected cities and countries do not pass strict filtering", () => {
  for (const location of ["Abu Dhabi, UAE", "Vancouver, Canada", "Berlin, Germany", "Worldwide", "Toronto, Australia"]) {
    assert.equal(matchesLocationPreferences(location, preferences), false, location);
  }
});

test("all cities country requires a country match", () => {
  assert.equal(matchesLocationPreferences("France", [{ country: "France", cities: [] }]), true);
  assert.equal(matchesLocationPreferences("Germany", [{ country: "France", cities: [] }]), false);
});

test("city matching handles accented characters without matching partial city names", () => {
  assert.equal(matchesLocationPreferences("Montréal, Canada", [{ country: "Canada", cities: ["Montreal"] }]), true);
  assert.equal(matchesLocationPreferences("Toronto, Canada", [{ country: "Canada", cities: ["Tor"] }]), false);
});

test("demo jobs each have a real individual selected location, not the full search summary", () => {
  assert.deepEqual(Array.from({ length: 4 }, (_, i) => demoLocation(preferences, i)), [
    "Dubai, United Arab Emirates", "Toronto, Canada", "Calgary, Canada", "United Kingdom",
  ]);
});
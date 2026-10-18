import XCTest
@testable import TimeGarden

final class AllowanceTests: XCTestCase {
    func testRewardsAndDeductions() {
        var value = Allowance()
        value.adjust(10, reason: "숙제")
        value.adjust(-5, reason: "약속")
        XCTAssertEqual(value.limit(), 35)
        XCTAssertEqual(value.entries.count, 2)
    }
    func testClampRecordsOnlyAppliedMinutes() {
        var value = Allowance()
        value.adjust(-60, reason: "차감")
        XCTAssertEqual(value.limit(), 0)
        XCTAssertEqual(value.entries.first?.minutes, -30)
        value.adjust(300, reason: "보상")
        XCTAssertEqual(value.limit(), 240)
        XCTAssertEqual(value.entries.first?.minutes, 240)
    }
    func testRewardsExpireAtMidnight() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        let today = Date(timeIntervalSince1970: 1_800_000_000)
        let yesterday = calendar.date(byAdding: .day, value: -1, to: today)!
        var value = Allowance()
        value.entries = [TimeEntry(date: yesterday, minutes: 20, reason: "어제")]
        XCTAssertEqual(value.limit(on: today, calendar: calendar), 30)
    }
    func testPersistenceRoundTrip() throws {
        var value = Allowance()
        value.adjust(15, reason: "도움")
        let restored = try JSONDecoder().decode(Allowance.self, from: JSONEncoder().encode(value))
        XCTAssertEqual(restored.limit(), 45)
        XCTAssertEqual(restored.entries.first?.reason, "도움")
    }
}

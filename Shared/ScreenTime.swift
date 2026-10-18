import DeviceActivity
import FamilyControls
import ManagedSettings
import Foundation

enum ScreenTime {
    static let activity = DeviceActivityName("daily-youtube")
    static let adjustedActivity = DeviceActivityName("adjusted-youtube")
    static let event = DeviceActivityEvent.Name("allowance-used")
    static let settings = ManagedSettingsStore(named: .init("time-garden"))

    static var selection: FamilyActivitySelection {
        get {
            guard let data = SharedStore.defaults.data(forKey: SharedStore.selectionKey),
                  let value = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
            else { return FamilyActivitySelection() }
            return value
        }
        set {
            if let data = try? JSONEncoder().encode(newValue) {
                SharedStore.defaults.set(data, forKey: SharedStore.selectionKey)
            }
        }
    }

    static var hasSelection: Bool {
        !selection.applicationTokens.isEmpty || !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty
    }

    static func shield() {
        let selected = selection
        settings.shield.applications = selected.applicationTokens
        settings.shield.applicationCategories = selected.categoryTokens.isEmpty ? nil : .specific(selected.categoryTokens)
        settings.shield.webDomains = selected.webDomainTokens
        settings.shield.webDomainCategories = selected.categoryTokens.isEmpty ? nil : .specific(selected.categoryTokens)
    }

    static func configure() throws {
        let center = DeviceActivityCenter()
        let minutes = SharedStore.load().limit()
        guard hasSelection else {
            center.stopMonitoring([activity, adjustedActivity])
            settings.clearAllSettings()
            return
        }
        let selected = selection
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59, second: 59),
            repeats: true
        )
        func limit(_ budget: Int) -> DeviceActivityEvent { DeviceActivityEvent(
            applications: selected.applicationTokens,
            categories: selected.categoryTokens,
            webDomains: selected.webDomainTokens,
            threshold: DateComponents(minute: max(1, budget)),
            includesPastActivity: true
        ) }
        // Keep a baseline monitor for future days. Only the current day's override
        // is honored by the extension, so rewards never carry into tomorrow.
        SharedStore.defaults.set(Calendar.current.startOfDay(for: Date()).timeIntervalSince1970, forKey: "adjustedDay")
        settings.clearAllSettings()
        do {
            try center.startMonitoring(activity, during: schedule, events: [event: limit(SharedStore.load().dailyMinutes)])
            try center.startMonitoring(adjustedActivity, during: schedule, events: [event: limit(minutes)])
        } catch {
            shield()
            throw error
        }
        if minutes == 0 { shield() }
    }

    static var hasTodaysOverride: Bool {
        SharedStore.defaults.double(forKey: "adjustedDay") == Calendar.current.startOfDay(for: Date()).timeIntervalSince1970
    }
}

import DeviceActivity
import Foundation

final class ActivityMonitor: DeviceActivityMonitor {
    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)
        guard activity == ScreenTime.activity else { return }
        // Never re-register a monitor from its callback. The baseline monitor
        // takes over after the date-scoped override expires.
        if SharedStore.load().limit() == 0 { ScreenTime.shield() }
        else { ScreenTime.settings.clearAllSettings() }
    }

    override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
        super.eventDidReachThreshold(event, activity: activity)
        guard event == ScreenTime.event else { return }
        let relevant = ScreenTime.hasTodaysOverride
            ? activity == ScreenTime.adjustedActivity
            : activity == ScreenTime.activity
        guard relevant else { return }
        ScreenTime.shield()
    }
}

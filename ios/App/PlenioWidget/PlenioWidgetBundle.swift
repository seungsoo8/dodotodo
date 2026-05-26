import WidgetKit
import SwiftUI

@main
struct PlenioWidgetBundle: WidgetBundle {
    var body: some Widget {
        PlenioAllWidget()
        PlenioTodayWidget()
        PlenioHighPriorityWidget()
        PlenioProgressWidget()
    }
}

import WidgetKit
import SwiftUI

private let appGroupId = "group.vito.dodotodo.com"
private let plenioAccent = Color(red: 99/255, green: 102/255, blue: 241/255)
private let todayColor  = Color(red: 16/255,  green: 185/255, blue: 129/255)
private let highColor   = Color(red: 239/255, green: 68/255,  blue: 68/255)

// MARK: - Data Models

struct WidgetTodo: Identifiable, Decodable {
    let id: String
    let title: String
    let completed: Bool
    let priority: String
    let urgency: String?
    let dueDate: String?
}

struct WidgetPayload: Decodable {
    let todos: [WidgetTodo]
    let completedToday: Int
}

struct WidgetEntry: TimelineEntry {
    let date: Date
    let todos: [WidgetTodo]
    let completedToday: Int
}

// MARK: - Helpers

private func priorityColor(_ priority: String) -> Color {
    switch priority {
    case "high":   return Color(red: 239/255, green: 68/255,  blue: 68/255)
    case "medium": return Color(red: 245/255, green: 158/255, blue: 11/255)
    default:       return Color(red: 148/255, green: 163/255, blue: 184/255)
    }
}

private func todayString() -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: Date())
}

// MARK: - Provider

struct PlenioProvider: TimelineProvider {
    enum Kind { case all, today, highPriority, progress }
    let kind: Kind

    private var placeholder: WidgetEntry {
        WidgetEntry(date: Date(), todos: [
            WidgetTodo(id: "1", title: "할 일을 추가해보세요", completed: false,
                       priority: "medium", urgency: nil, dueDate: nil)
        ], completedToday: 2)
    }

    func placeholder(in context: Context) -> WidgetEntry { placeholder }
    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        completion(context.isPreview ? placeholder : loadEntry())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date()
        completion(Timeline(entries: [loadEntry()], policy: .after(next)))
    }

    private func loadEntry() -> WidgetEntry {
        guard let defaults = UserDefaults(suiteName: appGroupId),
              let json = defaults.string(forKey: "widget_todos"),
              let data = json.data(using: .utf8) else {
            return WidgetEntry(date: Date(), todos: [], completedToday: 0)
        }
        if let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data) {
            return WidgetEntry(date: Date(), todos: payload.todos, completedToday: payload.completedToday)
        }
        if let todos = try? JSONDecoder().decode([WidgetTodo].self, from: data) {
            return WidgetEntry(date: Date(), todos: todos.filter { !$0.completed }, completedToday: 0)
        }
        return WidgetEntry(date: Date(), todos: [], completedToday: 0)
    }
}

// MARK: - Shared Todo Views

struct SmallTodoView: View {
    let todos: [WidgetTodo]
    let title: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(accent)
                Spacer()
                Text("\(todos.count)")
                    .font(.system(size: 22, weight: .bold))
            }
            Text("남은 할 일")
                .font(.system(size: 10))
                .foregroundColor(.secondary)
            Spacer()
            if let top = todos.first {
                HStack(spacing: 5) {
                    Circle().fill(priorityColor(top.priority)).frame(width: 6, height: 6)
                    Text(top.title)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(2)
                }
                .padding(8)
                .background(Color(UIColor.secondarySystemBackground))
                .cornerRadius(8)
            } else {
                Text("모두 완료! 🎉").font(.system(size: 12)).foregroundColor(.secondary)
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

struct MediumTodoView: View {
    let todos: [WidgetTodo]
    let title: String
    let accent: Color

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(accent)
                Spacer()
                Text("\(todos.count)")
                    .font(.system(size: 34, weight: .bold))
                Text("남은 할 일")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
            .frame(width: 72)

            Divider()

            VStack(alignment: .leading, spacing: 5) {
                if todos.isEmpty {
                    Spacer()
                    Text("모두 완료! 🎉").font(.system(size: 13)).foregroundColor(.secondary)
                    Spacer()
                } else {
                    ForEach(todos.prefix(4)) { todo in
                        HStack(spacing: 6) {
                            Circle().fill(priorityColor(todo.priority)).frame(width: 6, height: 6)
                            Text(todo.title).font(.system(size: 12)).lineLimit(1)
                            Spacer()
                            if todo.urgency == "urgent" { Text("⚡").font(.system(size: 10)) }
                        }
                    }
                    if todos.count > 4 {
                        Text("+ \(todos.count - 4)개 더")
                            .font(.system(size: 10)).foregroundColor(.secondary)
                    }
                    Spacer()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct LargeTodoView: View {
    let todos: [WidgetTodo]
    let title: String
    let accent: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(title).font(.system(size: 14, weight: .bold)).foregroundColor(accent)
                Spacer()
                Text("\(todos.count)개 남음").font(.system(size: 12)).foregroundColor(.secondary)
            }
            if todos.isEmpty {
                Spacer()
                Text("모두 완료! 🎉")
                    .font(.system(size: 14)).foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                ForEach(todos.prefix(8)) { todo in
                    HStack(spacing: 8) {
                        Circle().fill(priorityColor(todo.priority)).frame(width: 7, height: 7)
                        Text(todo.title).font(.system(size: 13)).lineLimit(1)
                        Spacer()
                        if todo.urgency == "urgent" { Text("⚡").font(.system(size: 11)) }
                        if let due = todo.dueDate {
                            Text(String(due.suffix(5))).font(.system(size: 10)).foregroundColor(.secondary)
                        }
                    }
                    .padding(.vertical, 3).padding(.horizontal, 6)
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(6)
                }
                if todos.count > 8 {
                    Text("+ \(todos.count - 8)개 더")
                        .font(.system(size: 10)).foregroundColor(.secondary)
                }
                Spacer()
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Progress Views

struct SmallProgressView: View {
    let completed: Int
    let total: Int
    private var ratio: Double { total == 0 ? 0 : Double(completed) / Double(total) }

    var body: some View {
        VStack(spacing: 6) {
            Text("진행률")
                .font(.system(size: 12, weight: .bold)).foregroundColor(plenioAccent)
                .frame(maxWidth: .infinity, alignment: .leading)
            Spacer()
            ZStack {
                Circle().stroke(Color.secondary.opacity(0.2), lineWidth: 9)
                Circle()
                    .trim(from: 0, to: ratio)
                    .stroke(plenioAccent, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                VStack(spacing: 1) {
                    Text("\(Int(ratio * 100))%").font(.system(size: 15, weight: .bold))
                    Text("완료").font(.system(size: 9)).foregroundColor(.secondary)
                }
            }
            .frame(width: 64, height: 64)
            Spacer()
            Text("\(completed) / \(total)개")
                .font(.system(size: 11)).foregroundColor(.secondary)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct MediumProgressView: View {
    let completed: Int
    let remaining: [WidgetTodo]
    private var total: Int { completed + remaining.count }
    private var ratio: Double { total == 0 ? 0 : Double(completed) / Double(total) }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("진행률")
                    .font(.system(size: 12, weight: .bold)).foregroundColor(plenioAccent)
                Spacer()
                ZStack {
                    Circle().stroke(Color.secondary.opacity(0.2), lineWidth: 7)
                    Circle()
                        .trim(from: 0, to: ratio)
                        .stroke(plenioAccent, style: StrokeStyle(lineWidth: 7, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(Int(ratio * 100))%").font(.system(size: 13, weight: .bold))
                }
                .frame(width: 54, height: 54)
                Text("\(completed)/\(total)").font(.system(size: 10)).foregroundColor(.secondary)
            }
            .frame(width: 70)

            Divider()

            VStack(alignment: .leading, spacing: 5) {
                if remaining.isEmpty {
                    Spacer()
                    Text(total == 0 ? "오늘 할 일 없음" : "오늘 완료! 🎉")
                        .font(.system(size: 12)).foregroundColor(.secondary)
                    Spacer()
                } else {
                    Text("오늘 남은 할 일")
                        .font(.system(size: 10, weight: .medium)).foregroundColor(.secondary)
                    ForEach(remaining.prefix(3)) { todo in
                        HStack(spacing: 6) {
                            Circle().fill(priorityColor(todo.priority)).frame(width: 6, height: 6)
                            Text(todo.title).font(.system(size: 12)).lineLimit(1)
                            Spacer()
                        }
                    }
                    if remaining.count > 3 {
                        Text("+ \(remaining.count - 3)개 더")
                            .font(.system(size: 10)).foregroundColor(.secondary)
                    }
                    Spacer()
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct LargeProgressView: View {
    let completed: Int
    let remaining: [WidgetTodo]
    private var total: Int { completed + remaining.count }
    private var ratio: Double { total == 0 ? 0 : Double(completed) / Double(total) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("오늘 진행률").font(.system(size: 14, weight: .bold)).foregroundColor(plenioAccent)
                Spacer()
                Text("\(completed)/\(total)개").font(.system(size: 12)).foregroundColor(.secondary)
            }
            VStack(alignment: .leading, spacing: 4) {
                GeometryReader { geo in
                    ZStack(alignment: .leading) {
                        RoundedRectangle(cornerRadius: 6)
                            .fill(Color.secondary.opacity(0.2)).frame(height: 12)
                        RoundedRectangle(cornerRadius: 6)
                            .fill(plenioAccent)
                            .frame(width: geo.size.width * ratio, height: 12)
                    }
                }
                .frame(height: 12)
                Text("\(Int(ratio * 100))% 완료").font(.system(size: 11)).foregroundColor(.secondary)
            }
            if remaining.isEmpty {
                Spacer()
                Text(total == 0 ? "오늘 할 일이 없어요" : "오늘 할 일 완료! 🎉")
                    .font(.system(size: 14)).foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, alignment: .center)
                Spacer()
            } else {
                Text("남은 할 일").font(.system(size: 11, weight: .medium)).foregroundColor(.secondary)
                ForEach(remaining.prefix(7)) { todo in
                    HStack(spacing: 8) {
                        Circle().fill(priorityColor(todo.priority)).frame(width: 7, height: 7)
                        Text(todo.title).font(.system(size: 13)).lineLimit(1)
                        Spacer()
                        if todo.urgency == "urgent" { Text("⚡").font(.system(size: 11)) }
                    }
                    .padding(.vertical, 3).padding(.horizontal, 6)
                    .background(Color(UIColor.secondarySystemBackground))
                    .cornerRadius(6)
                }
                if remaining.count > 7 {
                    Text("+ \(remaining.count - 7)개 더")
                        .font(.system(size: 10)).foregroundColor(.secondary)
                }
                Spacer()
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    }
}

// MARK: - Accessory Views (iOS 16+)

@available(iOS 16.0, *)
struct AccessoryCircularCountView: View {
    let count: Int
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 0) {
                Text("\(count)").font(.system(size: 18, weight: .bold))
                Text("개").font(.system(size: 9)).foregroundColor(.secondary)
            }
        }
    }
}

@available(iOS 16.0, *)
struct AccessoryCircularProgressView: View {
    let completed: Int
    let total: Int
    private var ratio: Double { total == 0 ? 0 : Double(completed) / Double(total) }
    var body: some View {
        ZStack {
            AccessoryWidgetBackground()
            VStack(spacing: 0) {
                Text("\(Int(ratio * 100))").font(.system(size: 16, weight: .bold))
                Text("%").font(.system(size: 9)).foregroundColor(.secondary)
            }
        }
    }
}

@available(iOS 16.0, *)
struct AccessoryRectangularView: View {
    let todos: [WidgetTodo]
    let label: String
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text("Plenio · \(label) \(todos.count)개").font(.headline).lineLimit(1)
            if let top = todos.first {
                Text(top.title).font(.caption).foregroundColor(.secondary).lineLimit(1)
            } else {
                Text("모두 완료!").font(.caption).foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// MARK: - Entry Views

struct PlenioAllEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: WidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallTodoView(todos: entry.todos, title: "Plenio", accent: plenioAccent)
        case .systemMedium:
            MediumTodoView(todos: entry.todos, title: "Plenio", accent: plenioAccent)
        case .systemLarge:
            LargeTodoView(todos: entry.todos, title: "전체 할 일", accent: plenioAccent)
        default:
            if #available(iOS 16.0, *) {
                switch family {
                case .accessoryCircular:
                    AccessoryCircularCountView(count: entry.todos.count)
                case .accessoryRectangular:
                    AccessoryRectangularView(todos: entry.todos, label: "할 일")
                default:
                    SmallTodoView(todos: entry.todos, title: "Plenio", accent: plenioAccent)
                }
            } else {
                SmallTodoView(todos: entry.todos, title: "Plenio", accent: plenioAccent)
            }
        }
    }
}

struct PlenioTodayEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: WidgetEntry
    var filtered: [WidgetTodo] { entry.todos.filter { $0.dueDate == todayString() } }

    var body: some View {
        switch family {
        case .systemSmall:
            SmallTodoView(todos: filtered, title: "오늘 마감", accent: todayColor)
        case .systemMedium:
            MediumTodoView(todos: filtered, title: "오늘 마감", accent: todayColor)
        case .systemLarge:
            LargeTodoView(todos: filtered, title: "오늘 마감", accent: todayColor)
        default:
            if #available(iOS 16.0, *) {
                switch family {
                case .accessoryCircular:
                    AccessoryCircularCountView(count: filtered.count)
                case .accessoryRectangular:
                    AccessoryRectangularView(todos: filtered, label: "오늘")
                default:
                    SmallTodoView(todos: filtered, title: "오늘 마감", accent: todayColor)
                }
            } else {
                SmallTodoView(todos: filtered, title: "오늘 마감", accent: todayColor)
            }
        }
    }
}

struct PlenioHighPriorityEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: WidgetEntry
    var filtered: [WidgetTodo] { entry.todos.filter { $0.priority == "high" } }

    var body: some View {
        switch family {
        case .systemSmall:
            SmallTodoView(todos: filtered, title: "높은 우선순위", accent: highColor)
        case .systemMedium:
            MediumTodoView(todos: filtered, title: "높은 우선순위", accent: highColor)
        case .systemLarge:
            LargeTodoView(todos: filtered, title: "높은 우선순위", accent: highColor)
        default:
            if #available(iOS 16.0, *) {
                switch family {
                case .accessoryCircular:
                    AccessoryCircularCountView(count: filtered.count)
                case .accessoryRectangular:
                    AccessoryRectangularView(todos: filtered, label: "우선순위")
                default:
                    SmallTodoView(todos: filtered, title: "높은 우선순위", accent: highColor)
                }
            } else {
                SmallTodoView(todos: filtered, title: "높은 우선순위", accent: highColor)
            }
        }
    }
}

struct PlenioProgressEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: WidgetEntry
    var todayRemaining: [WidgetTodo] { entry.todos.filter { $0.dueDate == todayString() } }
    var total: Int { entry.completedToday + todayRemaining.count }

    var body: some View {
        switch family {
        case .systemSmall:
            SmallProgressView(completed: entry.completedToday, total: total)
        case .systemMedium:
            MediumProgressView(completed: entry.completedToday, remaining: todayRemaining)
        case .systemLarge:
            LargeProgressView(completed: entry.completedToday, remaining: todayRemaining)
        default:
            if #available(iOS 16.0, *) {
                switch family {
                case .accessoryCircular:
                    AccessoryCircularProgressView(completed: entry.completedToday, total: total)
                case .accessoryRectangular:
                    AccessoryRectangularView(todos: todayRemaining, label: "진행률")
                default:
                    SmallProgressView(completed: entry.completedToday, total: total)
                }
            } else {
                SmallProgressView(completed: entry.completedToday, total: total)
            }
        }
    }
}

// MARK: - Widget Families Helper

private func allFamilies() -> [WidgetFamily] {
    if #available(iOS 16.0, *) {
        return [.systemSmall, .systemMedium, .systemLarge, .accessoryCircular, .accessoryRectangular]
    }
    return [.systemSmall, .systemMedium, .systemLarge]
}

// MARK: - Widget Configurations

struct PlenioAllWidget: Widget {
    let kind = "PlenioWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlenioProvider(kind: .all)) { entry in
            if #available(iOS 17.0, *) {
                PlenioAllEntryView(entry: entry).containerBackground(.fill.tertiary, for: .widget)
            } else {
                PlenioAllEntryView(entry: entry).padding().background()
            }
        }
        .configurationDisplayName("Plenio")
        .description("남은 할 일을 한눈에 확인하세요.")
        .supportedFamilies(allFamilies())
    }
}

struct PlenioTodayWidget: Widget {
    let kind = "PlenioTodayWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlenioProvider(kind: .today)) { entry in
            if #available(iOS 17.0, *) {
                PlenioTodayEntryView(entry: entry).containerBackground(.fill.tertiary, for: .widget)
            } else {
                PlenioTodayEntryView(entry: entry).padding().background()
            }
        }
        .configurationDisplayName("오늘 마감")
        .description("오늘 마감인 할 일을 확인하세요.")
        .supportedFamilies(allFamilies())
    }
}

struct PlenioHighPriorityWidget: Widget {
    let kind = "PlenioHighPriorityWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlenioProvider(kind: .highPriority)) { entry in
            if #available(iOS 17.0, *) {
                PlenioHighPriorityEntryView(entry: entry).containerBackground(.fill.tertiary, for: .widget)
            } else {
                PlenioHighPriorityEntryView(entry: entry).padding().background()
            }
        }
        .configurationDisplayName("높은 우선순위")
        .description("중요한 할 일을 놓치지 마세요.")
        .supportedFamilies(allFamilies())
    }
}

struct PlenioProgressWidget: Widget {
    let kind = "PlenioProgressWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PlenioProvider(kind: .progress)) { entry in
            if #available(iOS 17.0, *) {
                PlenioProgressEntryView(entry: entry).containerBackground(.fill.tertiary, for: .widget)
            } else {
                PlenioProgressEntryView(entry: entry).padding().background()
            }
        }
        .configurationDisplayName("오늘 진행률")
        .description("오늘 할 일의 진행 상황을 확인하세요.")
        .supportedFamilies(allFamilies())
    }
}

import Foundation
import SwiftUI

class AppState: ObservableObject {
    @Published var currentUser: User?
    @Published var isLoggedIn = false
    @Published var hasCompletedOnboarding = false
    @Published var hasRequestedPermissions = false
    @Published var navigationPath = NavigationPath()
    @Published var selectedTab: Tab = .friends
    @Published var selectedServerId: String?
    @Published var showSidebar = true

    @Published var friends: [User] = []
    @Published var chatGroups: [ChatGroup] = []
    @Published var servers: [Server] = []
    @Published var pendingCalls: [Call] = []
    @Published var activeCall: Call?

    let authManager = AuthManager()
    let chatManager = ChatManager()
    let callManager = CallManager()
    let serverManager = ServerManager()

    var currentUsername: String? { authManager.currentUsername }
    var currentUserId: String? { authManager.currentUserId }

    enum Tab: String, CaseIterable {
        case friends
        case play
        case servers
    }

    func loadDemoData() {
        friends = []
        chatGroups = []
        servers = []
    }

    func completeOnboarding() {
        hasCompletedOnboarding = true
        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
    }

    func completePermissions() {
        hasRequestedPermissions = true
        UserDefaults.standard.set(true, forKey: "hasRequestedPermissions")
    }
}

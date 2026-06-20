import SwiftUI

struct SignInView: View {
    @EnvironmentObject var appState: AppState
    @State private var showSignInMenu = false
    @State private var showCodeEntry = false
    @State private var codeInput = ""
    @State private var isSigningIn = false
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        VStack(spacing: 30) {
            Spacer()

            Image(systemName: "leaf.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 70, height: 70)
                .foregroundColor(Color(hex: "4ecca3"))

            Text("Growing & Gardening")
                .font(.title)
                .foregroundColor(.white)
                .fontWeight(.bold)

            Text("Sign in to continue")
                .font(.title3)
                .foregroundColor(Color(hex: "aaaaaa"))

            VStack(spacing: 16) {
                Button(action: { showSignInMenu = true }) {
                    HStack {
                        Image(systemName: "arrow.right.circle.fill")
                        Text("Sign In")
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(hex: "4ecca3"))
                    .cornerRadius(14)
                }
                .disabled(isSigningIn)
            }
            .padding(.horizontal, 40)
            .confirmationDialog("Sign in with...", isPresented: $showSignInMenu, titleVisibility: .visible) {
                Button("Guest Account") { signInAsGuest() }
                Button("Discord") { signInWithDiscord() }
                Button("Cancel", role: .cancel) {}
            }

            if showCodeEntry {
                VStack(spacing: 12) {
                    Text("Enter the 6-digit code shown on your PC")
                        .font(.subheadline)
                        .foregroundColor(Color(hex: "aaaaaa"))

                    TextField("000000", text: $codeInput)
                        .font(.system(size: 32, design: .monospaced))
                        .multilineTextAlignment(.center)
                        .keyboardType(.numberPad)
                        .foregroundColor(.white)
                        .frame(width: 200)
                        .padding()
                        .background(Color(hex: "1a1a2e"))
                        .cornerRadius(12)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(hex: "4ecca3"), lineWidth: 1)
                        )

                    Button(action: submitCode) {
                        Text("Sign In")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(codeInput.count == 6 ? Color(hex: "4ecca3") : Color.gray)
                            .cornerRadius(14)
                    }
                    .disabled(codeInput.count != 6 || isSigningIn)
                    .padding(.horizontal, 40)
                }
            } else {
                Button(action: { showCodeEntry = true }) {
                    HStack {
                        Image(systemName: "number.circle.fill")
                        Text("Enter Code")
                    }
                    .font(.subheadline)
                    .foregroundColor(Color(hex: "4ecca3"))
                    .padding(.vertical, 8)
                }
                .disabled(isSigningIn)
            }

            if isSigningIn {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Color(hex: "4ecca3")))
                    .scaleEffect(1.5)
            }

            Spacer()
        }
        .background(Color(hex: "0f0f23").ignoresSafeArea())
        .alert("Error", isPresented: $showError) {
            Button("OK") {}
        } message: {
            Text(errorMessage)
        }
    }

    func submitCode() {
        guard codeInput.count == 6 else { return }
        isSigningIn = true
        Task {
            let authResult = await appState.authManager.signInWithCode(code: codeInput)
            await MainActor.run {
                isSigningIn = false
                switch authResult {
                case .success:
                    appState.isLoggedIn = true
                    appState.currentUser = User(
                        id: appState.authManager.currentUserId ?? UUID().uuidString,
                        username: appState.authManager.currentUsername ?? "User",
                        status: .online
                    )
                case .failure(let error):
                    errorMessage = error.localizedDescription
                    showError = true
                }
            }
        }
    }

    func signInAsGuest() {
        isSigningIn = true
        Task {
            let success = await appState.authManager.signInAsGuest()
            await MainActor.run {
                isSigningIn = false
                if success {
                    appState.isLoggedIn = true
                    appState.currentUser = User(
                        id: appState.authManager.currentUserId ?? UUID().uuidString,
                        username: appState.authManager.currentUsername ?? "Guest",
                        status: .online
                    )
                }
            }
        }
    }

    func signInWithDiscord() {
        isSigningIn = true
        Task {
            let success = await appState.authManager.signInWithDiscord()
            await MainActor.run {
                isSigningIn = false
                if success {
                    appState.isLoggedIn = true
                    appState.currentUser = User(
                        id: appState.authManager.currentUserId ?? UUID().uuidString,
                        username: appState.authManager.currentUsername ?? "DiscordUser",
                        status: .online
                    )
                } else {
                    errorMessage = "Discord sign-in failed or was cancelled"
                    showError = true
                }
            }
        }
    }
}

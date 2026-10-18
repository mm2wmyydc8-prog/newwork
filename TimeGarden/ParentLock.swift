import CryptoKit
import Foundation
import Security

enum ParentLock {
    private static let service = "TimeGarden.ParentPIN"
    private static var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: service, kSecAttrAccount as String: "parent"]
    }
    private static func stored() -> Data? {
        var request = query
        request[kSecReturnData as String] = true
        request[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        guard SecItemCopyMatching(request as CFDictionary, &result) == errSecSuccess else { return nil }
        return result as? Data
    }
    static var isConfigured: Bool { stored() != nil }
    static func create(_ pin: String) throws {
        var salt = Data(count: 32)
        let status = salt.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 32, $0.baseAddress!) }
        guard status == errSecSuccess else { throw LockError.saveFailed }
        let digest = Data(SHA256.hash(data: salt + Data(pin.utf8)))
        var request = query
        request[kSecValueData as String] = salt + digest
        request[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        guard SecItemAdd(request as CFDictionary, nil) == errSecSuccess else { throw LockError.saveFailed }
    }
    static func verify(_ pin: String) -> Bool {
        guard let data = stored(), data.count == 64 else { return false }
        return Data(SHA256.hash(data: data.prefix(32) + Data(pin.utf8))) == data.suffix(32)
    }
    enum LockError: LocalizedError {
        case saveFailed
        var errorDescription: String? { "부모 비밀번호를 안전하게 저장하지 못했습니다." }
    }
}

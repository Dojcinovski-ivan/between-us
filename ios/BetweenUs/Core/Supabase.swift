import Foundation
import Supabase

/// The one Supabase client for the app. Uses the anon key only, so every
/// query runs under the same row-level security as the website. The session
/// is stored in the Keychain by supabase-swift.
let supabase = SupabaseClient(
    supabaseURL: AppConfig.supabaseURL,
    supabaseKey: AppConfig.supabaseAnonKey,
    options: SupabaseClientOptions(
        auth: SupabaseClientOptions.AuthOptions(emitLocalSessionAsInitialSession: true)
    )
)

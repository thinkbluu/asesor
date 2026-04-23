const { createClient } = require("@supabase/supabase-js")

const supabaseUrl = "https://vykbbfopbzxgosuxljxb.supabase.co"
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: "demo@asesor.ro",
    password: "Demo1234!",
    email_confirm: true,
    user_metadata: { first_name: "Demo", last_name: "Salon" },
  })

  if (error) {
    console.error("Error creating user:", error.message)
    process.exit(1)
  }

  console.log("User created:", data.user.id, data.user.email)

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      first_name: "Demo",
      last_name: "Salon",
      salon_name: "Salon Demo ASESOR",
      city: "București",
      phone: "0700 000 000",
      has_completed_onboarding: true,
    })

  if (profileError) {
    console.error("Error creating profile:", profileError.message)
  } else {
    console.log("Profile created successfully")
  }
}

main()

const rateLimitMap = new Map();
const failedLoginMap = new Map();

export default {
  async fetch(request, env, ctx) {
    // Oracle ORDS ana adresiniz (Az önce oluşturduğumuz API)
    const ORACLE_HOST = "https://GB0ABB62E885E33-PRACTIDE.adb.eu-frankfurt-1.oraclecloudapps.com/ords/admin";
    
    // Cloudflare Environment variable'dan çekilecek (Opsiyonel olarak rate-limit atlamak için)
    const ADMIN_TOKEN = env.ADMIN_TOKEN || "DEFAULT_ADMIN_TOKEN_YAZ_BURAYA"; 

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Admin-Token, X-Admin-Role",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const clientIP = request.headers.get("x-forwarded-for");
    const providedToken = request.headers.get('X-Admin-Token');
    const isAdminRole = request.headers.get('X-Admin-Role') === 'true';

    const isBypassLimit = providedToken === ADMIN_TOKEN && isAdminRole;

    // --- RATE LIMITING (IP Bazlı) ---
    if (clientIP && !isBypassLimit) {
      const now = Date.now();
      const ipData = rateLimitMap.get(clientIP) || { count: 0, firstRequestTime: now };

      if (now - ipData.firstRequestTime > 10000) { // 10 saniye
        ipData.count = 1;
        ipData.firstRequestTime = now;
      } else {
        ipData.count++;
      }

      rateLimitMap.set(clientIP, ipData);

      if (ipData.count > 5) {
        return new Response(JSON.stringify({ 
          error: "Too many requests. Please try again later." 
        }), { 
          status: 429, 
          headers: { "Content-Type": "application/json", "Retry-After": "10", ...corsHeaders } 
        });
      }
    }

    const url = new URL(request.url);

    // --- ŞİFRE HASHLEME (SHA-256) ---
    const hashPassword = async (password) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hash = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // İstenirse e-posta kontrolü de yapılabilir, ancak tablomuzda "username" kullanıyoruz
    // Bu yüzden basic bir username/password uzunluk kontrolü yapıyoruz.
    const isValidUsername = (username) => username && username.length >= 3;

    // ==========================================
    // 1. LOGIN ENDPOINT
    // ==========================================
    if (url.pathname === '/v1/api/login' && request.method === 'POST') {
      try {
        let body;
        try { body = await request.json(); } 
        catch (err) { return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }); }

        const { username, password } = body;

        if (!isValidUsername(username) || !password || password.length < 6) {
          return new Response(JSON.stringify({ error: "Invalid username or password format. Password must be at least 6 characters." }), { 
            status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } 
          });
        }

        // Hesaba yönelik Brute-Force engelleme (10 dakikada 5 hata = 15 dakika ban)
        const now = Date.now();
        const lockoutDuration = 10 * 60 * 1000;
        let loginAttempts = failedLoginMap.get(username) || { count: 0, firstFailTime: now };

        if (loginAttempts.count >= 5) {
          if (now - loginAttempts.firstFailTime < lockoutDuration) {
            console.warn(`Kilitli hesaba giriş denemesi engellendi: ${username}`);
            return new Response(JSON.stringify({ error: "Çok fazla hatalı giriş denemesi. Lütfen 15 dakika sonra tekrar deneyin." }), { 
              status: 429, headers: { "Content-Type": "application/json", "Retry-After": "900", ...corsHeaders } 
            });
          } else {
            loginAttempts = { count: 0, firstFailTime: now };
          }
        }

        const hashedPassword = await hashPassword(password);
        
        // ORDS AutoREST tablosundan kullanıcıyı bulma (Koleksiyon: users)
        const filter = JSON.stringify({ username });
        const ordsRes = await fetch(`${ORACLE_HOST}/users/?q=${encodeURIComponent(filter)}`);
        const data = await ordsRes.json();
        
        const user = (data.items || []).find(u => u.username === username && u.password_hash === hashedPassword);

        if (user) {
          failedLoginMap.delete(username); // Başarılı girişte fail sayacını sıfırla

          return new Response(JSON.stringify({
            id: user.id,
            username: user.username,
            created_at: user.created_at
          }), { 
            status: 200, 
            headers: { "Content-Type": "application/json", ...corsHeaders } 
          });
        }

        // Hatalı şifre
        if (loginAttempts.count === 0) loginAttempts.firstFailTime = now;
        loginAttempts.count++;
        failedLoginMap.set(username, loginAttempts);

        return new Response(JSON.stringify({ error: "Invalid username or password" }), { 
          status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } 
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    }

    // ==========================================
    // 2. REGISTER ENDPOINT
    // ==========================================
    if (url.pathname === '/v1/api/register' && request.method === 'POST') {
      try {
        let body;
        try { body = await request.json(); } 
        catch (err) { return new Response(JSON.stringify({ error: "Invalid JSON payload" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }); }

        const { username, password } = body;

        if (!isValidUsername(username) || !password || password.length < 6) {
          return new Response(JSON.stringify({ error: "Invalid username or password format. Password must be at least 6 characters." }), { 
            status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } 
          });
        }

        // Kullanıcı var mı diye kontrol et
        const filter = JSON.stringify({ username });
        const checkRes = await fetch(`${ORACLE_HOST}/users/?q=${encodeURIComponent(filter)}`);
        const checkData = await checkRes.json();
        const existingUser = (checkData.items || []).find(u => u.username === username);

        if (existingUser) {
          return new Response(JSON.stringify({ error: "Username already exists" }), { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }

        const hashedPassword = await hashPassword(password);
        const secureId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        // ORDS AutoREST tablosuna POST ile veri ekleme
        const insertRes = await fetch(`${ORACLE_HOST}/users/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: secureId,
            username: username,
            password_hash: hashedPassword,
            created_at: createdAt
          })
        });

        if (!insertRes.ok) {
          return new Response(JSON.stringify({ error: "Registration failed" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
        }

        return new Response(JSON.stringify({ 
          id: secureId, 
          username: username, 
          created_at: createdAt 
        }), { 
          status: 201, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
      }
    }

    // ==========================================
    // 3. PROXY ENDPOINT (Örn: Kelimeler için /v1/words)
    // ==========================================
    let proxyPath = url.pathname;
    if (proxyPath.startsWith('/v1/')) {
      proxyPath = proxyPath.substring(3); // /v1/ kısmını at, geri kalanı AutoREST'e yolla
    }
    const targetUrl = ORACLE_HOST + proxyPath + url.search;
    
    const cache = caches.default;
    const cacheKey = new Request(targetUrl, request);

    // Sadece "words" içeren GET isteklerini cacheliyoruz (Önceki örnekte places'ti)
    const isCacheable = request.method === 'GET' && proxyPath.includes('/words');

    if (isCacheable) {
      let cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        let response = new Response(cachedResponse.body, cachedResponse);
        response.headers.set("Access-Control-Allow-Origin", "*");
        response.headers.set("X-Cache", "HIT");
        return response;
      }
    }

    const newRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });

    try {
      const response = await fetch(newRequest);
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      
      let finalResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });

      if (isCacheable && finalResponse.status === 200) {
        finalResponse.headers.set("X-Cache", "MISS");
        // Kelimeler için cache süresini biraz kısa tutabiliriz, eklenince hemen görünmesi için
        finalResponse.headers.set("Cache-Control", "public, max-age=60");
        ctx.waitUntil(cache.put(cacheKey, finalResponse.clone()));
      } else {
        finalResponse.headers.set("X-Cache", "BYPASS");
        finalResponse.headers.set("Cache-Control", "no-cache");
      }

      return finalResponse;

    } catch (proxyError) {
      return new Response(JSON.stringify({ error: "Veritabanı sunucusuna bağlanılamadı." }), {
        status: 502, 
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }
  },
};

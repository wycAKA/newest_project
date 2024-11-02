// middleware.ts
import {NextResponse} from 'next/server'

export function middleware() {
    // 必要に応じて認証チェックやリダイレクトの処理を追加
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/users/channels/:path*',
        '/users/messages/:path*',
    ]
}

'use client';

import { usePathname } from "next/navigation";




export default function TemplatePage() {
    // Extract id from url
    const id = usePathname().split('/').pop();
    return (
        <div>
            Template Page {id}
        </div>
    )
}
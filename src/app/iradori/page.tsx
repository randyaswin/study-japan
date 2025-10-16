import { Suspense } from 'react';
import IradoriClient from './IradoriClient';

export default function IradoriPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <IradoriClient />
        </Suspense>
    );
}
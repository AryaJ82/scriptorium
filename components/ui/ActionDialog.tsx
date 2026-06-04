'use client';

import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "./Button";

export default function ActionDialogue({
    title,
    description,
    isOpen,
    setIsOpen,
    confirmAction,
    actionLoading,
}: {
    title: string,
    description: string,
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    confirmAction: () => void,
    actionLoading: boolean,

}) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                        className="tracking-tight break-all leading-tight"
                    >
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} disabled={actionLoading}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" size="sm" onClick={confirmAction} disabled={actionLoading}>
                        {actionLoading ? 'Processing…' : 'Confirm'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
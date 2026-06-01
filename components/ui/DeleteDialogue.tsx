'use client';

import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "./Button";

export default function DeleteDialogue({
    title,
    description,
    isDeleteOpen,
    setIsDeleteOpen,
    confirmDelete,
    deleteSaving,
}: {
    title?: string,
    description?: string,
    isDeleteOpen: boolean,
    setIsDeleteOpen: (open: boolean) => void,
    confirmDelete: () => void,
    deleteSaving: boolean,

}) {
    return (
        <Dialog open={isDeleteOpen} onOpenChange={(open) => setIsDeleteOpen(open)}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle
                    className="text-red-500  tracking-tight break-all leading-tight"
                    >{title ?? "Delete Template"}</DialogTitle>
                    <DialogDescription>
                        {description ?? "Are you sure you want to delete this template? This action cannot be undone."}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={deleteSaving}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleteSaving}>
                        {deleteSaving ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
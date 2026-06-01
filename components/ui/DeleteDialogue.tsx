'use client';

import { Dialog, DialogContent, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "./Button";

export default function DeleteDialogue({
    isDeleteOpen,
    setIsDeleteOpen,
    confirmDelete,
    deleteSaving
}: {
    isDeleteOpen: boolean,
    setIsDeleteOpen: (open: boolean) => void,
    confirmDelete: () => void,
    deleteSaving: boolean
}) {
    return (
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete template</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this template? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost" size="sm">Cancel</Button>
                    </DialogClose>
                    <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleteSaving}>
                        {deleteSaving ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
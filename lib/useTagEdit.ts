
import { useCallback, useState } from "react";
import { validateTagValue } from '@/utils/inputValidation/generalValidation';
import { toast } from 'sonner'


export function useTagEdit() {
    const [tagDraft, setTagDraft] = useState<string>('');
    const [tags, setTags] = useState<string[]>([]);

    const addTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>, tagDraft: string) => {
        if ((e.key === 'Enter' || e.key === ',' || e.key === "#" || e.key === ' ' || e.key === '&' || e.key === '$') && tagDraft.trim()) {
            e.preventDefault();
            const newTag = tagDraft.trim().toLowerCase();
            const error = validateTagValue(newTag);
            if (error) {
                toast.error(error.message);
                return;
            }

            if (!tags.includes(newTag)) setTags([...tags, newTag]);
            setTagDraft('');
        }
    }, [tagDraft, tags]);

    const removeTag = useCallback((tag: string) => {
        setTags(tags.filter((current) => current !== tag));
    }, [tags]);

    return { tagDraft, setTagDraft, tags, setTags, addTag, removeTag };
}
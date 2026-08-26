"use client";

import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import ArrowGlyph from "@/app/components/server/ui/ArrowGlyph";
import EmptyState from "@/app/components/server/ui/EmptyState";

type CollectionNotFoundProps = {
	name: string;
};

export default function CollectionNotFound({ name }: CollectionNotFoundProps) {
	const router = useRouter();

	return (
		<EmptyState
			title="Collection not found"
			description={`No collection named “${name}” exists.`}
			action={
				<Button variant="contained" onClick={() => router.push("/knowledge_center")}>
					Back to Collections
					<ArrowGlyph />
				</Button>
			}
		/>
	);
}

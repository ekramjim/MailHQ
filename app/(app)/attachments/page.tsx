import { getAttachments } from "@/app/actions/attachments";
import { AttachmentsList } from "@/components/attachments/attachments-list";

export default async function AttachmentsPage() {
  const attachments = await getAttachments();
  return <AttachmentsList initialAttachments={attachments} />;
}

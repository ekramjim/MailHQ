import { getContacts } from "@/app/actions/contacts";
import { ContactsView } from "@/components/contacts/contacts-view";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return <ContactsView fallbackData={contacts} />;
}

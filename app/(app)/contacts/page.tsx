import { getContacts } from "@/app/actions/contacts";
import { ContactsTable } from "@/components/contacts/contacts-table";

export default async function ContactsPage() {
  const contacts = await getContacts();

  return <ContactsTable initialContacts={contacts} />;
}

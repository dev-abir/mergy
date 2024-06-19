export class ContactResponseDto {
  contact: {
    primaryContatctId: number;
    emails: string[]; // first element being email of primary contact
    phoneNumbers: string[]; // first element being phoneNumber of primary contact
    secondaryContactIds: number[]; // Array of all Contact IDs that are "secondary contacts"
  };
}

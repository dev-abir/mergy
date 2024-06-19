import { Injectable, Logger } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactResponseDto } from './dto/contact-response.dto';

interface PrimarySecondaryPair {
  primaryContact: Contact;
  secondaryContacts: Contact[];
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly logger: Logger,
  ) {}

  findAll() {
    return this.contactRepository.find();
  }

  async deleteAll() {
    return (await this.contactRepository.delete({})).affected;
  }

  async identity(createContactDto: CreateContactDto): Promise<ContactResponseDto> {
    const email = createContactDto.email;
    const phoneNumber = createContactDto.phoneNumber;

    // get contacts with similar email, in ascending order of creation date
    const similarContactsByEmail = email
      ? await this.contactRepository.find({
          where: {
            email: createContactDto.email,
          },
          order: {
            createdAt: 'ASC',
          },
        })
      : [];
    // get contacts with similar phoneNumber, in ascending order of creation date
    const similarContactsByPhone = phoneNumber
      ? await this.contactRepository.find({
          where: {
            phoneNumber: createContactDto.phoneNumber,
          },
          order: {
            createdAt: 'ASC',
          },
        })
      : [];

    let result: PrimarySecondaryPair;
    if (similarContactsByEmail.length === 0 && similarContactsByPhone.length === 0) {
      // if no similar contacts found, just make a new "primary" contact
      result = await this.createPrimaryContact(createContactDto);
      this.logger.log(1, result);
    } else if (similarContactsByEmail.length === 0 || similarContactsByPhone.length === 0) {
      // if one of them is blank, then we will make a "secondary" contact
      result = await this.createSecondaryContact(
        createContactDto,
        similarContactsByEmail,
        similarContactsByPhone,
      );
      this.logger.log(2);
    } else {
      // if there are similar contacts by both email and phone
      // then, we need to mutate some contacts to secondary
      result = await this.handleSimilarByBothEmailAndPhone(
        createContactDto,
        similarContactsByEmail,
        similarContactsByPhone,
      );
      this.logger.log('3', result.secondaryContacts);
    }

    let secondaryFromPrimary = [];
    // could be null in the
    if (result.primaryContact.id !== null) {
      secondaryFromPrimary = await this.contactRepository.findBy({
        linkedId: result.primaryContact.id,
      });
    }
    const response = new ContactResponseDto();
    response.contact = {
      emails: [
        ...new Set(
          [
            result.primaryContact.email,
            ...secondaryFromPrimary.map((c) => c.email),
            ...result.secondaryContacts.map((c) => c.email),
          ].filter((e) => !!e),
        ),
      ],
      phoneNumbers: [
        ...new Set(
          [
            result.primaryContact.phoneNumber,
            ...secondaryFromPrimary.map((c) => c.phoneNumber),
            ...result.secondaryContacts.map((c) => c.phoneNumber),
          ].filter((e) => !!e),
        ),
      ],
      primaryContatctId: result.primaryContact.id,
      secondaryContactIds: [
        ...new Set([
          ...secondaryFromPrimary.map((c) => c.id),
          ...result.secondaryContacts.map((c) => c.id),
        ]),
      ],
    };
    return response;
  }

  private async createPrimaryContact(
    createContactDto: CreateContactDto,
  ): Promise<PrimarySecondaryPair> {
    let contact = new Contact();
    contact.email = createContactDto.email;
    contact.phoneNumber = createContactDto.phoneNumber;
    contact.linkPrecedence = 'primary';

    return {
      primaryContact: await this.contactRepository.save(contact),
      secondaryContacts: [],
    };
  }

  private async createSecondaryContact(
    createContactDto: CreateContactDto,
    similarContactsByEmail: Contact[],
    similarContactsByPhone: Contact[],
  ): Promise<PrimarySecondaryPair> {
    // first contact from either of them should be the primary one
    // as they are already sorted by creation date
    let primaryContact = similarContactsByEmail[0] || similarContactsByPhone[0];
    if (primaryContact.linkPrecedence !== 'primary') {
      this.logger.warn(primaryContact.id, 'is not primary.');
      this.logger.log(primaryContact.linkedId, 'trying...');
      primaryContact = await this.contactRepository.findOneBy({
        id: primaryContact.linkedId,
      });
    }

    if (similarContactsByEmail.length > 0) {
      let willInsert = true;
      // if phone number is null, then no need to insert
      if (!createContactDto.phoneNumber) willInsert = false;

      // if a contact by phone number matches, while iterating through contacts by email
      // then, such a contact is already present no need to insert
      for (let i = 0; i < similarContactsByEmail.length; i++) {
        const current = similarContactsByEmail[i];
        if (willInsert && current.phoneNumber === createContactDto.phoneNumber) {
          willInsert = false;
          break;
        }
      }

      if (!willInsert)
        return {
          primaryContact: primaryContact,
          secondaryContacts: similarContactsByEmail.filter((c) => c.linkPrecedence !== 'primary'),
        };
    } else {
      // vice-versa
      let willInsert = true;
      // if email is null, then no need to insert
      if (!createContactDto.email) willInsert = false;

      for (let i = 0; i < similarContactsByPhone.length; i++) {
        const current = similarContactsByPhone[i];
        if (willInsert && current.email === createContactDto.email) {
          willInsert = false;
          break;
        }
      }

      if (!willInsert)
        return {
          primaryContact: primaryContact,
          secondaryContacts: similarContactsByPhone.filter((c) => c.linkPrecedence !== 'primary'),
        };
    }

    let newContact = new Contact();
    newContact.email = createContactDto.email;
    newContact.phoneNumber = createContactDto.phoneNumber;
    newContact.linkPrecedence = 'secondary';
    newContact.linkedId = primaryContact.id;
    newContact = await this.contactRepository.save(newContact);

    const secondaryContacts = similarContactsByEmail
      .concat(similarContactsByPhone)
      .filter((c) => c.linkPrecedence !== 'primary');
    this.logger.log(secondaryContacts);
    return {
      primaryContact: primaryContact,
      secondaryContacts: [newContact, ...secondaryContacts],
    };
  }

  private async handleSimilarByBothEmailAndPhone(
    createContactDto: CreateContactDto,
    similarContactsByEmail: Contact[],
    similarContactsByPhone: Contact[],
  ): Promise<PrimarySecondaryPair> {
    // first contact should be the primary one
    // as they are already sorted by creation date
    const primaryContactByEmail = similarContactsByEmail[0];
    const primaryContactByPhone = similarContactsByPhone[0];
    let secondaryContacts = similarContactsByEmail
      .concat(similarContactsByPhone)
      .filter((c) => c.linkPrecedence !== 'primary');
    secondaryContacts = this.uniqueContacts(secondaryContacts);

    if (primaryContactByEmail.id === primaryContactByPhone.id) {
      // if similar contacts search yields the same result,
      // the, the request is a totally duplicate entry ignore...
      this.logger.warn(createContactDto, 'ignored.');
      return {
        primaryContact: primaryContactByEmail,
        secondaryContacts: secondaryContacts,
      };
    } else if (primaryContactByEmail.createdAt < primaryContactByPhone.createdAt) {
      if (primaryContactByEmail.linkPrecedence !== 'primary')
        this.logger.warn(primaryContactByEmail.id, 'is not primary.');

      // if primaryContatctByEmail was created earlier,
      // then all similarContactsByPhone should become secondary
      // and link to the prmary one
      for (let i = 0; i < similarContactsByPhone.length; i++) {
        similarContactsByPhone[i].linkPrecedence = 'secondary';
        similarContactsByPhone[i].linkedId = primaryContactByEmail.id;
      }
      similarContactsByPhone = await this.contactRepository.save(similarContactsByPhone);
      return {
        primaryContact: primaryContactByEmail,
        // WARN: this isn't guaranteed to be unique, must call new Set() later
        secondaryContacts: secondaryContacts.concat(similarContactsByPhone),
      };
    } else {
      // vice-versa
      if (primaryContactByPhone.linkPrecedence !== 'primary')
        this.logger.warn(primaryContactByPhone.id, 'is not primary.');

      for (let i = 0; i < similarContactsByEmail.length; i++) {
        similarContactsByEmail[i].linkPrecedence = 'secondary';
        similarContactsByEmail[i].linkedId = primaryContactByPhone.id;
      }
      similarContactsByEmail = await this.contactRepository.save(similarContactsByEmail);
      return {
        primaryContact: primaryContactByPhone,
        // WARN: this isn't guaranteed to be unique, must call new Set() later
        secondaryContacts: secondaryContacts.concat(similarContactsByEmail),
      };
    }
  }

  private uniqueContacts(contacts: Contact[]): Contact[] {
    const mem = new Set();
    const result = [];
    for (let i = 0; i < contacts.length; i++) {
      if (!mem.has(contacts[i].id)) {
        result.push(contacts[i]);
        mem.add(contacts[i].id);
      }
    }
    return result;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContactResponseDto } from './dto/contact-response.dto';

@ApiTags('identity')
@Controller('identity')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @HttpCode(200)
  @ApiResponse({ status: 400 })
  identity(@Body() createContactDto: CreateContactDto) {
    if (!createContactDto.email && !createContactDto.phoneNumber)
      throw new BadRequestException('Both email and phone number cannot be null.');
    return this.contactsService.identity(createContactDto);
  }

  @Delete()
  deleteAll() {
    return this.contactsService.deleteAll();
  }

  @Get()
  findAll() {
    return this.contactsService.findAll();
  }
}

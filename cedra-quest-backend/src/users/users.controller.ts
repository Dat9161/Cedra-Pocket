import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ConnectWalletDto } from './dto/connect-wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.id.toString());
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post('connect-wallet')
  @UseGuards(JwtAuthGuard)
  connectWallet(
    @CurrentUser() user: any,
    @Body() connectWalletDto: ConnectWalletDto,
  ) {
    return this.usersService.connectWallet(user.id.toString(), connectWalletDto);
  }

  @Post('add-points')
  @UseGuards(JwtAuthGuard)
  async addPoints(
    @CurrentUser() user: any,
    @Body() body: { points: number },
  ) {
    const updatedUser = await this.usersService.addPoints(BigInt(user.id), body.points);
    // Convert BigInt to string for JSON serialization
    return {
      id: updatedUser.id.toString(),
      telegram_id: updatedUser.telegram_id,
      username: updatedUser.username,
      total_points: Number(updatedUser.total_points),
      current_rank: updatedUser.current_rank,
      wallet_address: updatedUser.wallet_address,
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
